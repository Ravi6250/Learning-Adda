import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext'; 

const Quiz = ({ topic }) => {
  const { backendUrl } = useContext(AppContext);

  const [searchTopic, setSearchTopic] = useState(topic || ""); 
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  // 👇 Ye hai hamari state jisko true karna hai
  const [showResult, setShowResult] = useState(false);

  const handleGenerateQuiz = async () => {
    if (!searchTopic) return alert("Please enter a topic first!");
    
    setLoading(true);
    setError(null);
    setQuizData(null);
    setSelectedAnswers({});
    setShowResult(false);

    try {
      const { data } = await axios.post(`${backendUrl}/api/ai/generate-quiz`, {
        topic: searchTopic
      });

      if (data.success) {
        setQuizData(data.quizData);
      } else {
        setError("Quiz generate nahi ho paya. Try again.");
      }
    } catch (err) {
      console.log(err);
      setError("Server Error: Backend connect nahi ho raha.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionIndex, option) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: option,
    });
  };

  const calculateScore = () => {
    let score = 0;
    quizData.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        score++;
      }
    });
    return score;
  };

  return (
    <div className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 max-w-2xl mx-auto shadow-md transition-colors duration-300">
      
      {/* Header */}
      <div className="mb-4 text-center">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">🤖 AI Quiz Generator</h3>
        
        {!topic && !quizData && (
          <input 
            type="text" 
            placeholder="Enter Topic (e.g. React Hooks)" 
            value={searchTopic}
            onChange={(e) => setSearchTopic(e.target.value)}
            className="p-2.5 w-4/5 mb-2.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
          />
        )}
      </div>

      {/* Generate Button */}
      {!quizData && !loading && (
        <div className="text-center">
          <button onClick={handleGenerateQuiz} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-md cursor-pointer text-base transition-colors">
            {topic ? `Start ${topic} Quiz` : "Generate Quiz"}
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="my-5 text-indigo-500 dark:text-indigo-400 text-center animate-pulse">
          <p>⏳ Thinking unique questions...</p>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {/* Quiz Questions */}
      {quizData && (
        <div className="mt-5 text-left">
          {quizData.map((q, index) => (
            <div key={index} className="mb-5 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600 transition-colors">
              <p className="text-base mb-3 text-gray-900 dark:text-gray-100"><strong>Q{index + 1}: {q.question}</strong></p>
              
              <div className="flex flex-col gap-2">
                {q.options.map((opt, i) => {
                  const isSelected = selectedAnswers[index] === opt;
                  const isCorrect = showResult && opt === q.correctAnswer;
                  const isWrong = showResult && isSelected && opt !== q.correctAnswer;
                  
                  let btnClass = "p-2.5 text-left bg-white dark:bg-gray-800 border rounded-md cursor-pointer transition-colors duration-200 ";
                  
                  if (isCorrect) {
                    btnClass += "bg-green-100 dark:bg-green-900/40 border-green-500 text-green-800 dark:text-green-400";
                  } else if (isWrong) {
                    btnClass += "bg-red-100 dark:bg-red-900/40 border-red-500 text-red-800 dark:text-red-400";
                  } else if (!showResult && isSelected) {
                    btnClass += "bg-indigo-50 dark:bg-indigo-900/40 border-indigo-500 text-indigo-800 dark:text-indigo-300";
                  } else {
                    btnClass += "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleOptionSelect(index, opt)}
                      disabled={showResult}
                      className={btnClass}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Submit Button */}
          {!showResult && (
            <div className="text-center mt-4">
              {/* ✅ YAHAN FIX KIYA HAI: setShowQuiz(true) ko setShowResult(true) kar diya */}
              <button onClick={() => setShowResult(true)} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md cursor-pointer text-base transition-colors">
                Submit Quiz
              </button>
            </div>
          )}

          {/* Result Section */}
          {showResult && (
            <div className="mt-5 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center border border-green-500 transition-colors">
              <h3 className="text-xl font-bold text-green-700 dark:text-green-400">You Scored: {calculateScore()} / 5</h3>
              <button onClick={handleGenerateQuiz} className="bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 text-white px-4 py-2 rounded-md cursor-pointer mt-3 transition-colors">
                Try Another Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Quiz;