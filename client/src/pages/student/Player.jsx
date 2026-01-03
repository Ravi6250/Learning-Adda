import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import YouTube from 'react-youtube';
import { assets } from '../../assets/assets';
import { useParams } from 'react-router-dom';
import humanizeDuration from 'humanize-duration';
import axios from 'axios';
import { toast } from 'react-toastify';
import Rating from '../../components/student/Rating';
import Footer from '../../components/student/Footer';
import Loading from '../../components/student/Loading';
import Quiz from '../../components/student/Quiz';
import CourseNotes from '../../components/student/CourseNotes'; // ✅ 1. Import Notes Component

// --- HELPER FUNCTION ---
const getYouTubeId = (url) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      return urlObj.searchParams.get('v');
    }
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    return null;
  } catch (error) {
    console.error("Invalid URL for YouTube ID extraction:", error);
    return null;
  }
};

const Player = () => {
  const { enrolledCourses, backendUrl, getToken, calculateChapterTime, userData, fetchUserEnrolledCourses } = useContext(AppContext);
  const { courseId } = useParams();
  
  const [courseData, setCourseData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [initialRating, setInitialRating] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);

  // Course Data Fetch logic
  const getCourseData = () => {
    const course = enrolledCourses.find(c => c._id === courseId);
    if (course) {
      setCourseData(course);
      const userRating = course.courseRatings.find(r => r.userId === userData._id);
      if (userRating) {
        setInitialRating(userRating.rating);
      }
    }
  };

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const markLectureAsCompleted = async (lectureId) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/update-course-progress`,
        { courseId, lectureId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success(data.message);
        getCourseProgress();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const getCourseProgress = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/get-course-progress`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setProgressData(data.progressData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleRate = async (rating) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/add-rating`,
        { courseId, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success(data.message);
        fetchUserEnrolledCourses();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (userData && enrolledCourses.length > 0) {
      getCourseData();
    }
  }, [userData, enrolledCourses]);

  useEffect(() => {
    if (courseData) {
      getCourseProgress();
    }
  }, [courseData]);

  // Reset quiz visibility when video changes
  useEffect(() => {
    setShowQuiz(false);
  }, [playerData]);

  return courseData ? (
    <>
      <div className='p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36'>
        
        {/* LEFT SIDE: Course Structure */}
        <div className="text-gray-800">
          <h2 className="text-xl font-semibold">Course Structure</h2>
          <div className="pt-5">
            {courseData.courseContent.map((chapter, index) => (
              <div key={chapter.chapterId || index} className="border border-gray-300 bg-white mb-2 rounded">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                  onClick={() => toggleSection(index)}
                >
                  <div className="flex items-center gap-2">
                    <img src={assets.down_arrow_icon} alt="arrow icon" className={`transform transition-transform ${openSections[index] ? "rotate-180" : ""}`} />
                    <p className="font-medium md:text-base text-sm">{chapter.chapterTitle}</p>
                  </div>
                  <p className="text-sm md:text-default">{chapter.chapterContent.length} lectures - {calculateChapterTime(chapter)}</p>
                </div>

                <div className={`overflow-hidden transition-all duration-300 ${openSections[index] ? "max-h-96" : "max-h-0"}`}>
                  <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300">
                    {chapter.chapterContent.map((lecture, i) => (
                      <li key={lecture.lectureId || i} className="flex items-start gap-2 py-1">
                        <img src={progressData && progressData.lectureCompleted.includes(lecture.lectureId) ? assets.blue_tick_icon : assets.play_icon} alt="bullet icon" className="w-4 h-4 mt-1" />
                        <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-default">
                          <p>{lecture.lectureTitle}</p>
                          <div className='flex gap-2'>
                            {lecture.lectureUrl && <p onClick={() => setPlayerData({ ...lecture, chapter: index + 1, lecture: i + 1 })} className='text-blue-500 cursor-pointer'>Watch</p>}
                            <p>{humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ['h', 'm'] })}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 py-3 mt-10">
            <h1 className="text-xl font-bold">Rate this Course:</h1>
            <Rating initialRating={initialRating} onRate={handleRate} />
          </div>
        </div>

        {/* RIGHT SIDE: Video Player, Notes & Quiz */}
        <div className='md:mt-10'>
          {playerData ? (
            <div>
              <YouTube iframeClassName='w-full aspect-video' videoId={getYouTubeId(playerData.lectureUrl)} />
              
              <div className='flex justify-between items-center mt-1'>
                <p className='text-xl'>{playerData.chapter}.{playerData.lecture} {playerData.lectureTitle}</p>
                <button onClick={() => markLectureAsCompleted(playerData.lectureId)} className='text-blue-600'>
                  {progressData && progressData.lectureCompleted.includes(playerData.lectureId) ? 'Completed' : 'Mark Complete'}
                </button>
              </div>

              {/* ✅ 2. NEW: AI Smart Notes Section */}
              <CourseNotes 
                  lectureTitle={playerData.lectureTitle} 
                  lectureDescription={courseData.courseDescription} 
              />

              {/* ✅ 3. EXISTING: AI Quiz Section (Manual Input) */}
              <div className="mt-8 p-5 bg-indigo-50 border border-indigo-100 rounded-lg">
                <div className="flex justify-between items-center">
                   <div>
                      <h3 className="font-bold text-lg text-indigo-900">Quiz Generator 🤖</h3>
                      <p className="text-sm text-gray-600">Type any topic to test your knowledge.</p>
                   </div>
                   <button 
                     onClick={() => setShowQuiz(!showQuiz)}
                     className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition duration-200 text-sm"
                   >
                     {showQuiz ? "Close Quiz" : "Take AI Quiz"}
                   </button>
                </div>

                {showQuiz && (
                  <div className="mt-5 bg-white p-4 rounded shadow-sm border">
                    <Quiz />
                  </div>
                )}
              </div>

            </div>
          ) : (
            courseData.courseThumbnail && <img src={courseData.courseThumbnail} alt="Course Thumbnail" />
          )}
        </div>
      </div>
      <Footer />
    </>
  ) : <Loading />;
};

export default Player;