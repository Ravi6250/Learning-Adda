import React, { useState } from 'react';
import axios from 'axios';

const Quiz = ({ topic }) => {
  // Agar prop se topic aaya to wo use karo, nahi to user input karega
  const [searchTopic, setSearchTopic] = useState(topic || ""); 
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);

  // Quiz Generate Karne ka Function
  const handleGenerateQuiz = async () => {
    if (!searchTopic) return alert("Please enter a topic first!");
    
    setLoading(true);
    setError(null);
    setQuizData(null);
    setSelectedAnswers({});
    setShowResult(false);

    try {
      // NOTE: Port 3300 use kiya hai aapke server log ke hisaab se
      const { data } = await axios.post('http://localhost:3300/api/ai/generate-quiz', {
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

  // Option select karne par
  const handleOptionSelect = (questionIndex, option) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: option,
    });
  };

  // Score count karna
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
    <div style={styles.container}>
      
      <div style={styles.header}>
        <h3>🤖 AI Quiz Generator</h3>
        {/* Agar topic prop nahi diya, to input dikhao */}
        {!topic && !quizData && (
          <input 
            type="text" 
            placeholder="Enter Topic (e.g. React Hooks)" 
            value={searchTopic}
            onChange={(e) => setSearchTopic(e.target.value)}
            style={styles.input}
          />
        )}
      </div>

      {/* Generate Button */}
      {!quizData && !loading && (
        <button onClick={handleGenerateQuiz} style={styles.buttonPrimary}>
          {topic ? `Start ${topic} Quiz` : "Generate Quiz"}
        </button>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ margin: '20px 0', color: '#6366f1' }}>
          <p>⏳ Thinking unique questions...</p>
        </div>
      )}

      {/* Error Message */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Quiz Questions */}
      {quizData && (
        <div style={styles.quizBox}>
          {quizData.map((q, index) => (
            <div key={index} style={styles.questionCard}>
              <p style={styles.questionText}><strong>Q{index + 1}: {q.question}</strong></p>
              
              <div style={styles.optionsGrid}>
                {q.options.map((opt, i) => {
                  const isSelected = selectedAnswers[index] === opt;
                  const isCorrect = showResult && opt === q.correctAnswer;
                  const isWrong = showResult && isSelected && opt !== q.correctAnswer;
                  
                  // Styles for options
                  let btnStyle = { ...styles.optionBtn };
                  if (isCorrect) btnStyle = { ...btnStyle, ...styles.correct };
                  if (isWrong) btnStyle = { ...btnStyle, ...styles.wrong };
                  if (!showResult && isSelected) btnStyle = { ...btnStyle, ...styles.selected };

                  return (
                    <button
                      key={i}
                      onClick={() => handleOptionSelect(index, opt)}
                      disabled={showResult}
                      style={btnStyle}
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
            <button onClick={() => setShowResult(true)} style={styles.buttonSuccess}>
              Submit Quiz
            </button>
          )}

          {/* Result Section */}
          {showResult && (
            <div style={styles.resultBox}>
              <h3>You Scored: {calculateScore()} / 5</h3>
              <button onClick={handleGenerateQuiz} style={styles.buttonSecondary}>
                Try Another Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// CSS Styles Object
const styles = {
  container: { padding: '20px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#fff', maxWidth: '600px', margin: '20px auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  header: { marginBottom: '15px', textAlign: 'center' },
  input: { padding: '10px', width: '80%', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' },
  buttonPrimary: { background: '#4f46e5', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' },
  buttonSuccess: { background: '#22c55e', color: '#fff', padding: '12px 24px', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '10px', fontSize: '16px' },
  buttonSecondary: { background: '#374151', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '10px' },
  quizBox: { marginTop: '20px', textAlign: 'left' },
  questionCard: { marginBottom: '20px', padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #eee' },
  questionText: { fontSize: '16px', marginBottom: '10px' },
  optionsGrid: { display: 'flex', flexDirection: 'column', gap: '8px' },
  optionBtn: { padding: '10px', textAlign: 'left', background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', transition: '0.2s' },
  selected: { background: '#e0e7ff', borderColor: '#6366f1' },
  correct: { background: '#dcfce7', borderColor: '#22c55e' },
  wrong: { background: '#fee2e2', borderColor: '#ef4444' },
  resultBox: { marginTop: '20px', padding: '15px', background: '#ecfdf5', borderRadius: '8px', textAlign: 'center', border: '1px solid #22c55e' }
};

export default Quiz;