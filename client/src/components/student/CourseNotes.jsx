import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CourseNotes = ({ lectureTitle, lectureDescription }) => {
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
      // Backend Route check karlena (Port 3300 ya 5000 jo bhi aapka server port hai)
      const { data } = await axios.post('http://localhost:3300/api/ai/generate-summary', {
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
    <div className="mt-5 p-5 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
      
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-yellow-800">📝 Smart Notes Generator</h3>
          <p className="text-sm text-gray-600">Want a quick summary of this video?</p>
        </div>
        
        {!summaryData && !loading && (
          <button 
            onClick={handleGenerateSummary}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm transition"
          >
            Create Notes
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-yellow-700 text-sm animate-pulse">
          ⏳ AI is watching the video and writing notes for you...
        </div>
      )}

      {/* Error State */}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Notes Display Section */}
      {summaryData && (
        <div className="bg-white p-4 rounded border border-yellow-100">
          <h4 className="font-bold text-gray-800 mb-2">📌 {summaryData.summaryTitle}</h4>
          <ul className="list-disc pl-5 space-y-1">
            {summaryData.points.map((point, index) => (
              <li key={index} className="text-gray-700 text-sm leading-relaxed">
                {point}
              </li>
            ))}
          </ul>
          
          <button 
            onClick={() => setSummaryData(null)}
            className="mt-4 text-xs text-gray-500 hover:text-gray-800 underline"
          >
            Clear Notes
          </button>
        </div>
      )}

    </div>
  );
};

export default CourseNotes;