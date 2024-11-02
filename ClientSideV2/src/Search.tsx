import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Search.css';

interface SearchResult {
  _id: string;
  name: string;
  year: string;
  descriptions: string[];
  uploadDate: string;
}

interface Article {
  name: string;
  _id: string;
}

interface HistogramData {
  ranges: string[];
  docCounts: number[];
  imageCounts: number[];
}

const Search: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [articleYear, setArticleYear] = useState<string>('');
  const [uploadDateStart, setUploadDateStart] = useState<string>('');
  const [uploadDateEnd, setUploadDateEnd] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<string>('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [articleCount, setArticleCount] = useState<number>(0);
  const [histogramData, setHistogramData] = useState<HistogramData | null>(null);
  const [showHistograms, setShowHistograms] = useState<boolean>(false);
  const [yearError, setYearError] = useState<string>('');

  useEffect(() => {
    fetchArticles();
    fetchArticleCount();
  }, []);

  const validateYear = (year: string) => {
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(year, 10);
    return !isNaN(yearNum) && yearNum > 0 && yearNum <= currentYear;
  };
  
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newYear = e.target.value;
    setArticleYear(newYear);
    if (newYear && !validateYear(newYear)) {
      setYearError('Please enter a valid year');
    } else {
      setYearError('');
    }
  };

  const fetchArticles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<Article[]>('http://localhost:5000/api/articles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setArticles(response.data);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('Failed to fetch articles. Please try again later.');
    }
  };

  const fetchArticleCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<{ count: number }>('http://localhost:5000/api/article-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setArticleCount(response.data.count);
    } catch (error) {
      console.error('Error fetching article count:', error);
    }
  };

  const toggleHistograms = async () => {
    if (showHistograms) {
      setShowHistograms(false);
    } else {
      if (!histogramData) {
        await fetchHistogramData();
      } else {
        setShowHistograms(true);
      }
    }
  };

  const fetchHistogramData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<HistogramData>('http://localhost:5000/api/histogram-data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setHistogramData(response.data);
      setShowHistograms(true);
    } catch (error) {
      console.error('Error fetching histogram data:', error);
      setError('Failed to fetch histogram data. Please try again later.');
    }
  };

  const renderHistograms = () => {
    if (!histogramData) return null;

    const chartData = histogramData.ranges.map((range, index) => ({
      range,
      documents: histogramData.docCounts[index],
      images: histogramData.imageCounts[index],
    }));

    return (
      <div className="histograms-container">
        <h2>Document Histogram</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="documents" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>

        <h2>Image Histogram</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="images" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);

    if (articleYear && !validateYear(articleYear)) {
      setError('Please enter a valid year');
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<SearchResult[]>('http://localhost:5000/api/search', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          name: searchTerm,
          year: articleYear,
          uploadDateStart,
          uploadDateEnd,
          selectedArticle,
        },
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setResults(null);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (articleId: string) => {
    if (!articleId) {
      setError('Cannot delete article: Invalid article ID');
      return;
    }

    if (window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/article/${articleId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setResults(prevResults => prevResults ? prevResults.filter(result => result._id !== articleId) : null);
        setArticles(prevArticles => prevArticles.filter(article => article._id !== articleId));
        alert('Article deleted successfully');
      } catch (error) {
        console.error('Error deleting article:', error);
        setError('An error occurred while deleting the article. Please try again.');
      }
    }
  };

  const toggleRowExpansion = (index: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  

  return (
    <div className="search-container">
      <h1>Search</h1>
      <p>Enter an article name or term to search the database</p>
      <p>You have {articleCount} article{articleCount !== 1 ? 's' : ''} in total</p>
      <div className="search-form">
        <input
          type="text"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Article name"
        />
        <input
          type="number"
          className={`search-input ${yearError ? 'input-error' : ''}`}
          value={articleYear}
          onChange={handleYearChange}
          placeholder="Article year"
        />
        {yearError && <span className="error-message">{yearError}</span>}
        <input
          type="date"
          className="search-input"
          value={uploadDateStart}
          onChange={(e) => setUploadDateStart(e.target.value)}
          placeholder="Upload date start"
        />
        <input
          type="date"
          className="search-input"
          value={uploadDateEnd}
          onChange={(e) => setUploadDateEnd(e.target.value)}
          placeholder="Upload date end"
        />
        <select
          className="search-input"
          value={selectedArticle}
          onChange={(e) => setSelectedArticle(e.target.value)}
        >
          <option value="">Select an article</option>
          {articles.map((article) => (
            <option key={article._id} value={article._id}>
              {article.name}
            </option>
          ))}
        </select>
        <button onClick={handleSearch} className="search-button" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
        <button onClick={toggleHistograms} className="search-button">
          {showHistograms ? 'Hide Histograms' : 'Show Histograms'}
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      {showHistograms && renderHistograms()}
      {results ? (
        results.length > 0 ? (
          <table className="results-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Year</th>
                <th>Upload Date</th>
                <th>Descriptions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <React.Fragment key={result._id}>
                  <tr onClick={() => toggleRowExpansion(index)} style={{cursor: 'pointer'}}>
                    <td>{result.name}</td>
                    <td>{result.year}</td>
                    <td>{formatDate(result.uploadDate)}</td>
                    <td>{result.descriptions[0]?.substring(0, 50)}...</td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(result._id);
                        }}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {expandedRows.has(index) && (
                    <tr className="expanded-row">
                      <td colSpan={5}>
                        <ul>
                          {result.descriptions.map((desc, descIndex) => (
                            <li key={descIndex}>{desc}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-results">No results found</div>
        )
      ) : (
        <div className="no-results">Enter search criteria and click Search</div>
      )}
    </div>
  );
};

export default Search;