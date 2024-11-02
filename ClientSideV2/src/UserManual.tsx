import React from 'react';
import './UserManual.css'; // Import the CSS file for styling

const UserManual = () => {
  return (
    <div className="manual-container">
      <h1>User Manual</h1>
    <div className="content">
        <h2>Upload Page:</h2>
        <h3>Uploading a Paper</h3>
        <p>
            <span className="point">Navigate to the "Upload" page.</span>
            <span className="point">Click the "Choose File" button to select a PDF file of the paper containing images.</span>
            <span className="point">In the provided fields, enter the Paper Title and the Date of Publication. The title you provide<br></br> will be stored in the database.</span>
            <span className="point">Click the "Upload" button to submit your paper.</span>
            <span className="point">Once the upload is complete, a confirmation message will appear, and the paper will be <br></br>saved in the database.</span>
           
        </p>

        <h2>Search Page:</h2>
        <h3>Searching for Papers</h3>
        <p>
            <span className="point">Navigate to the "Search" page.</span>
            <span className="point">Enter the Paper Title or a Keyword in the search bar.</span>
            <span className="point">Click the "Search" button to initiate the search.</span>
            <span className="point">The search will be conducted among all the papers in the database associated with <br></br>your user account.</span>
            <span className="point">The results will be displayed on the same page in a table format, showing the relevant papers<br></br> and their details.</span>
        </p>
 </div>

    </div>
  );
};

export default UserManual;
