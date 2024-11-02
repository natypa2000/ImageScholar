import os
import bcrypt
import fitz  # PyMuPDF for PDF processing
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
import requests
import base64
from openai import OpenAI
from bson.objectid import ObjectId
from gridfs import GridFS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import logging
from datetime import datetime, timedelta, timezone
from bson import json_util
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
import secrets
from bson.errors import InvalidId


app = Flask(__name__)
secret_key = secrets.token_hex(32)
app.config['JWT_SECRET_KEY'] = secret_key  # Change this!
jwt = JWTManager(app)
CORS(app)

#key='' put your openAI APi key here
#client = OpenAI(api_key=key, organization='', project='')

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def encode_image(image_path):
  with open(image_path, "rb") as image_file:
    return base64.b64encode(image_file.read()).decode('utf-8')

app.config['MONGO_URI'] = 'mongodb://localhost:27017/test'
mongo = PyMongo(app)
users_collection = mongo.db.users
file_collection = mongo.db.files
images_collection = mongo.db.images


@app.route('/api/user-profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    current_user_id = get_jwt_identity()
    user = users_collection.find_one({'_id': ObjectId(current_user_id)})
    if user:
        return jsonify({
            'name': user.get('name', ''),
            'surname': user.get('surname', ''),
            'email': user['email']
        }), 200
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/user-profile', methods=['PUT'])
@jwt_required()
def update_user_profile():
    current_user_id = get_jwt_identity()
    data = request.json
    name = data.get('name')
    surname = data.get('surname')

    result = users_collection.update_one(
        {'_id': ObjectId(current_user_id)},
        {'$set': {'name': name, 'surname': surname}}
    )

    if result.modified_count > 0:
        return jsonify({'message': 'Profile updated successfully'}), 200
    return jsonify({'error': 'Failed to update profile'}), 400


@app.route('/api/article/<article_id>', methods=['DELETE'])
@jwt_required()
def delete_article(article_id):
    current_user_id = get_jwt_identity()

    try:
        # Check if the article exists and belongs to the current user
        article = file_collection.find_one({'_id': ObjectId(article_id), 'user_id': current_user_id})
        if not article:
            return jsonify({'error': 'Article not found or you do not have permission to delete it'}), 404

        # Initialize GridFS
        fs = GridFS(mongo.db)

        # Delete the file from GridFS
        if 'filename' in article:
            grid_file = fs.find_one({'filename': article['filename']})
            if grid_file:
                fs.delete(grid_file._id)

        # Delete associated images from the images collection
        images_collection.delete_many({'file_id': ObjectId(article_id)})

        # Delete the article from the file collection
        file_collection.delete_one({'_id': ObjectId(article_id)})

        return jsonify({'message': 'Article and associated data deleted successfully'}), 200

    except InvalidId:
        return jsonify({'error': 'Invalid article ID'}), 400
    except Exception as e:
        app.logger.error(f"Error during article deletion: {str(e)}")
        return jsonify({'error': 'An error occurred while deleting the article'}), 500



@app.route('/api/user-profile', methods=['DELETE'])
@jwt_required()
def delete_user_profile():
    current_user_id = get_jwt_identity()

    try:
        # Get user's files
        file_docs = list(file_collection.find({'user_id': current_user_id}))

        # Initialize GridFS
        fs = GridFS(mongo.db)

        # Delete GridFS files
        for file_doc in file_docs:
            if 'filename' in file_doc:
                try:
                    # Find the file in GridFS
                    grid_file = fs.find_one({'filename': file_doc['filename']})
                    if grid_file:
                        # Delete the file from GridFS (this removes entries from both fs.files and fs.chunks)
                        fs.delete(grid_file._id)
                    else:
                        logging.warning(f"GridFS file not found for filename: {file_doc['filename']}")
                except Exception as e:
                    logging.error(f"Error deleting GridFS file {file_doc['filename']}: {str(e)}")

        # Delete user's images
        images_collection.delete_many({'file_id': {'$in': [file['_id'] for file in file_docs]}})

        # Delete user's files from file_collection
        file_collection.delete_many({'user_id': current_user_id})

        # Finally, delete the user
        result = users_collection.delete_one({'_id': ObjectId(current_user_id)})

        if result.deleted_count > 0:
            return jsonify({'message': 'User account and all associated data deleted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to delete user account'}), 400

    except Exception as e:
        logging.error(f"Error during user deletion: {str(e)}")
        return jsonify({'error': 'An error occurred while deleting the user account'}), 500


@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email')
    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({'message': 'If this email is registered, you will receive a password reset link.'}), 200

    # Generate a unique token
    reset_token = secrets.token_urlsafe(32)
    expiration_time = datetime.now(timezone.utc) + timedelta(hours=1)  # Token expires in 1 hour

    # Store the token in the database
    users_collection.update_one(
        {'_id': user['_id']},
        {'$set': {'reset_token': reset_token, 'reset_token_expires': expiration_time}}
    )

    # Send email with reset link
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')  # Default to localhost if not set
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"
    try:
        send_reset_email(email, reset_link)
        return jsonify({'message': 'If this email is registered, you will receive a password reset link.'}), 200
    except Exception as e:
        logger.error(f"Failed to send reset email: {str(e)}")
        return jsonify({'error': 'An error occurred while processing your request.'}), 500

def send_reset_email(email, reset_link):
    # Configure your email settings
    smtp_server = os.getenv('EMAIL_SERVER')
    smtp_port = int(os.getenv('EMAIL_PORT'))
    smtp_username = os.getenv('EMAIL_USER')
    smtp_password = os.getenv('EMAIL_PASSWORD')

    # Create the email message
    msg = MIMEMultipart()
    msg['From'] = smtp_username
    msg['To'] = email
    msg['Subject'] = "Password Reset Request"

    body = f"Click the following link to reset your password: {reset_link}"
    msg.attach(MIMEText(body, 'plain'))

    try:
        # Send the email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        logger.info(f"Password reset email sent to {email}")
    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP Authentication Error. Please check your email credentials.")
        raise
    except Exception as e:
        logger.error(f"An error occurred while sending email: {str(e)}")
        raise


@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    token = data.get('token')
    new_password = data.get('password')

    user = users_collection.find_one({'reset_token': token, 'reset_token_expires': {'$gt': datetime.now(timezone.utc)}})
    if not user:
        return jsonify({'error': 'Invalid or expired token'}), 400

    # Hash the new password
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())

    # Update the user's password and remove the reset token
    users_collection.update_one(
        {'_id': user['_id']},
        {
            '$set': {'password': hashed_password.decode('utf-8')},
            '$unset': {'reset_token': "", 'reset_token_expires': ""}
        }
    )

    return jsonify({'message': 'Password reset successful'}), 200


@app.route('/api/check-email', methods=['POST'])
def check_email():
    data = request.json
    email = data.get('email')
    existing_user = users_collection.find_one({"email": email})
    if existing_user:
        return jsonify({'exists': True})
    return jsonify({'exists': False})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    existing_user = users_collection.find_one({"email": email})
    if existing_user:
        print("Email already exists!")
        return jsonify({'message': 'User already registered'})
    # Hash password using bcrypt
    # Save user data to MongoDB
    users_collection.insert_one({'email': email, 'password': password})

    return jsonify({'message': 'User registered successfully'})

@app.route('/api/login',methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    new_password = data.get('password').encode('utf-8')  # Encode as bytes

    user = users_collection.find_one({'email': email})
    if user and bcrypt.checkpw(new_password, user['password'].encode('utf-8')):
        access_token = create_access_token(identity=str(user['_id']))
        return jsonify(access_token=access_token), 200
    else:
        return jsonify({'error': 'Invalid email or password'}), 401

def contains_logo(description):
    logo_keywords = ["logo", "insignia", "press", "university", "institute"]
    return any(keyword in description.lower() for keyword in logo_keywords)

@app.route('/api/upload', methods=['POST'])
@jwt_required()
def upload():
    current_user_id = get_jwt_identity()
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    name = request.form.get('name')
    year = request.form.get('year')
    if not name or not year:
        return jsonify({'error': 'Name and year are required'}), 400

    try:
        # Save metadata to MongoDB
        file_id = file_collection.insert_one({
            'user_id': current_user_id,
            'name': name,
            'year': year,
            'upload_date': datetime.utcnow(),
            'filename': file.filename,
        }).inserted_id

        # Save file to MongoDB GridFS
        mongo.save_file(file.filename, file)

        # Read the file stream and extract images from PDF
        file.stream.seek(0)  # Reset the file stream position to the beginning
        pdf_document = fitz.open(stream=file.stream.read(), filetype="pdf")
        images = []
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            image_list = page.get_images(full=True)
            for img_index, img in enumerate(image_list):
                xref = img[0]
                base_image = pdf_document.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                image_filename = f"{file.filename}_page{page_num + 1}_img{img_index + 1}.{image_ext}"
                image_path = os.path.join('', image_filename)

                if image_ext == "jb2":
                    continue

                with open(image_path, "wb") as img_file:
                    img_file.write(image_bytes)

                base64_image = encode_image(image_path)
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {key}"
                }

                payload = {
                    "model": "gpt-4o",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "describe all objects in the pictures?"
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ],
                    "max_tokens": 300
                }

                response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
                response_data = response.json()

                image_description = response_data['choices'][0]['message']['content'] if response_data['choices'] else ''

                if image_description and not contains_logo(image_description):
                    # Save image metadata to MongoDB
                    image_doc = {
                        'file_id': file_id,
                        'filename': image_filename,
                        'page_number': page_num + 1,
                        'image_index': img_index + 1,
                        'image_path': image_path,
                        'description': image_description
                    }
                    images.append(image_doc)
                    images_collection.insert_one(image_doc)

        return jsonify({'message': 'Article and images uploaded successfully'}), 200

    except Exception as e:
        # Log the error for debugging
        app.logger.error(f"Error during file upload: {str(e)}")
        return jsonify({'error': 'An error occurred during file upload'}), 500


@app.route('/api/histogram-data', methods=['GET'])
@jwt_required()
def get_histogram_data():
    current_user_id = get_jwt_identity()

    # Get all documents for the current user
    documents = list(file_collection.find({'user_id': current_user_id}, {'year': 1}))

    # Get all images for the current user's documents
    document_ids = [doc['_id'] for doc in documents]
    images = list(images_collection.find({'file_id': {'$in': document_ids}}))

    # Process document years
    doc_years = [int(doc['year']) for doc in documents if 'year' in doc]

    # Process image years (assuming images have the same year as their parent document)
    image_years = []
    for image in images:
        parent_doc = next((doc for doc in documents if doc['_id'] == image['file_id']), None)
        if parent_doc and 'year' in parent_doc:
            image_years.append(int(parent_doc['year']))

    # Calculate ranges
    all_years = doc_years + image_years
    if not all_years:
        return jsonify({'error': 'No data available'}), 404

    min_year = min(all_years)
    max_year = max(all_years)
    range_size = max(1, (max_year - min_year) // 10)
    ranges = [(min_year + i * range_size, min_year + (i + 1) * range_size) for i in range(10)]

    # Count documents and images in each range
    doc_counts = [0] * 10
    image_counts = [0] * 10

    for year in doc_years:
        for i, (start, end) in enumerate(ranges):
            if start <= year < end:
                doc_counts[i] += 1
                break

    for year in image_years:
        for i, (start, end) in enumerate(ranges):
            if start <= year < end:
                image_counts[i] += 1
                break

    return jsonify({
        'ranges': [f"{start}-{end}" for start, end in ranges],
        'docCounts': doc_counts,
        'imageCounts': image_counts
    }), 200

@app.route('/api/articles', methods=['GET'])
@jwt_required()
def get_articles():
    current_user_id = get_jwt_identity()
    articles = list(file_collection.find({'user_id': current_user_id}, {'name': 1}))
    # Convert ObjectId to string for each article
    for article in articles:
        article['_id'] = str(article['_id'])
    return json_util.dumps(articles)

@app.route('/api/article-count', methods=['GET'])
@jwt_required()
def get_article_count():
    current_user_id = get_jwt_identity()
    count = file_collection.count_documents({'user_id': current_user_id})
    return jsonify({'count': count}), 200

@app.route('/api/search', methods=['GET'])
@jwt_required()
def search():
    current_user_id = get_jwt_identity()
    name = request.args.get('name')
    year = request.args.get('year')
    upload_date_start = request.args.get('uploadDateStart')
    upload_date_end = request.args.get('uploadDateEnd')
    selected_article = request.args.get('selectedArticle')

    query = {}

    query['user_id'] = current_user_id
    if name:
        query['name'] = {'$regex': name, '$options': 'i'}
    if year:
        query['year'] = year
    if selected_article:
        query['_id'] = ObjectId(selected_article)

    if upload_date_start or upload_date_end:
        query['upload_date'] = {}
        if upload_date_start:
            start_date = datetime.strptime(upload_date_start, '%Y-%m-%d')
            query['upload_date']['$gte'] = start_date
        if upload_date_end:
            end_date = datetime.strptime(upload_date_end, '%Y-%m-%d') + timedelta(days=1)
            query['upload_date']['$lt'] = end_date

    articles = list(file_collection.find(query))
    if not articles:
        return jsonify({"message": "No articles found matching the criteria"}), 404

    results = []
    for article in articles:
        images = images_collection.find({"file_id": article["_id"]})
        image_descriptions = [image["description"] for image in images]

        result = {
            "_id": str(article["_id"]),  # Convert ObjectId to string
            "name": article["name"],
            "year": article["year"],
            "uploadDate": article.get("upload_date", "").isoformat() if isinstance(article.get("upload_date"), datetime) else "",
            "descriptions": image_descriptions
        }
        results.append(result)

    return jsonify(results), 200


if __name__ == '__main__':
   app.run(debug=True)
