import React from 'react';
import './RelatedPage.css'; // Import the CSS file for styling

const RelatedPage = () => {
  return (
    <div className="related-container">
      <h1>About ImageScholar</h1>
      <p>

Welcome to imageScholar,
 an innovative engine for extracting images from academic papers. 
 <br></br>Our project was born out of the increasing need within the research community for easy and quick access<br></br> to visual data in scientific articles.
 <br></br> Until now, no such repository existed, and we are proud to be the first to offer this unique solution.
 <br></br>
At imagesScholar, academics from universities worldwide can register and upload papers containing images. 
<br></br>Behind the scenes, a sophisticated algorithm named FITZ extracts the images from the papers accurately<br></br> and efficiently.
Additionally, we utilize ChatGPT's AI, which identifies objects in the images and provides detailed descriptions of what is found.
<br></br> All this information is stored in a database along with details about the image's location in the paper.

When a user uploads a paper to the site, they enter the paper's title and year of publication.
 Following this, they can use our search system to find data and images from the papers.
The search is conducted by paper title or keyword, and the results are displayed in a table including the paper title, year of publication, and records of the images and objects found.
Moreover, we offer a page with graphs and filters for the data, allowing users to display multiple papers by year range, and more. Our system provides essential tools for researchers, enabling thorough and convenient analysis of visual data.
<br></br>
<br></br>
imagesScholar was developed by students from Bar-Ilan University in Israel, and we are proud to contribute to the global research community. 
We believe our system will enhance the accessibility of visual data in scientific articles and assist researchers across all fields.
<br></br>
<br></br>
Thank you for choosing ImageScholar. We wish you a productive and efficient research experience.</p>
    </div>
  );
};

export default RelatedPage;
