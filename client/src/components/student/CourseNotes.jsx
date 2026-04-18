import React, { useState, useEffect, useContext } from 'react'; 
import axios from 'axios';
import { AppContext } from '../../context/AppContext'; 

const CourseNotes = ({ lectureTitle, lectureDescription }) => {
  const { backendUrl } = useContext(AppContext);

  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Jab bhi naya lecture start ho, purane notes hata do
  useEffect(() => {
    setSummaryData(null);
    setError(null);
  }, [lectureTitle]);

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(`${backendUrl}/api/ai/generate-summary`, {
        lectureTitle: lectureTitle,
        lectureDescription: lectureDescription || "Generate key takeaways for this lecture."
      });

      if (data.success) {
        setSummaryData(data.summaryData);
      } else {
        setError("Notes generate nahi ho paye.");
      }
    } catch (err) {
      console.log(err);
      setError("Server Error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // 👇 1. Main Container Dark Mode Fix
    <div className="mt-5 p-5 bg-yellow-50 dark:bg-gray-800 border border-yellow-200 dark:border-gray-700 rounded-lg shadow-sm transition-colors duration-300">
      
      <div className="flex justify-between items-center mb-4">
        <div>
          {/* 👇 2. Heading and Subtitle Colors */}
          <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-500">📝 Smart Notes Generator</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Want a quick summary of this video?</p>
        </div>
        
        {!summaryData && !loading && (
          <button 
            onClick={handleGenerateSummary}
            className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-500 text-white px-4 py-2 rounded-md text-sm transition-colors"
          >
            Create Notes
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-yellow-700 dark:text-yellow-500 text-sm animate-pulse">
          ⏳ AI is watching the video and writing notes for you...
        </div>
      )}

      {/* Error State */}
      {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

      {/* Notes Display Section */}
      {summaryData && (
        // 👇 3. Inner Notes Box Dark Mode Fix
        <div className="bg-white dark:bg-gray-900 p-4 rounded border border-yellow-100 dark:border-gray-700 transition-colors duration-300">
          <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">📌 {summaryData.summaryTitle}</h4>
          <ul className="list-disc pl-5 space-y-1">
            {summaryData.points.map((point, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {point}
              </li>
            ))}
          </ul>
          
          <button 
            onClick={() => setSummaryData(null)}
            className="mt-4 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline transition-colors"
          >
            Clear Notes
          </button>
        </div>
      )}

    </div>
  );
};

export default CourseNotes;