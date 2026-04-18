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
import CourseNotes from '../../components/student/CourseNotes';

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

  useEffect(() => {
    setShowQuiz(false);
  }, [playerData]);

  return courseData ? (
    <>
      <div className='p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36 transition-colors duration-300'>
        
        {/* LEFT SIDE: Course Structure */}
        <div className="text-gray-800 dark:text-gray-200">
          <h2 className="text-xl font-semibold dark:text-white">Course Structure</h2>
          <div className="pt-5">
            {courseData.courseContent.map((chapter, index) => (
              // 👇 1. Structure Card Dark Mode
              <div key={chapter.chapterId || index} className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 mb-2 rounded transition-colors">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                  onClick={() => toggleSection(index)}
                >
                  <div className="flex items-center gap-2">
                    <img src={assets.down_arrow_icon} alt="arrow icon" className={`transform transition-transform dark:invert opacity-70 ${openSections[index] ? "rotate-180" : ""}`} />
                    <p className="font-medium md:text-base text-sm dark:text-gray-200">{chapter.chapterTitle}</p>
                  </div>
                  <p className="text-sm md:text-default dark:text-gray-400">{chapter.chapterContent.length} lectures - {calculateChapterTime(chapter)}</p>
                </div>

                <div className={`overflow-hidden transition-all duration-300 ${openSections[index] ? "max-h-96" : "max-h-0"}`}>
                  <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 dark:text-gray-300 border-t border-gray-300 dark:border-gray-700">
                    {chapter.chapterContent.map((lecture, i) => (
                      <li key={lecture.lectureId || i} className="flex items-start gap-2 py-1">
                        <img src={progressData && progressData.lectureCompleted.includes(lecture.lectureId) ? assets.blue_tick_icon : assets.play_icon} alt="bullet icon" className="w-4 h-4 mt-1 dark:invert opacity-70" />
                        <div className="flex items-center justify-between w-full text-gray-800 dark:text-gray-300 text-xs md:text-default">
                          <p>{lecture.lectureTitle}</p>
                          <div className='flex gap-2'>
                            {lecture.lectureUrl && <p onClick={() => setPlayerData({ ...lecture, chapter: index + 1, lecture: i + 1 })} className='text-blue-500 dark:text-blue-400 cursor-pointer'>Watch</p>}
                            <p className="dark:text-gray-400">{humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ['h', 'm'] })}</p>
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
            <h1 className="text-xl font-bold dark:text-white">Rate this Course:</h1>
            <Rating initialRating={initialRating} onRate={handleRate} />
          </div>
        </div>

        {/* RIGHT SIDE: Video Player, Notes & Quiz */}
        <div className='md:mt-10'>
          {playerData ? (
            <div>
              <YouTube iframeClassName='w-full aspect-video rounded-md shadow-md' videoId={getYouTubeId(playerData.lectureUrl)} />
              
              <div className='flex justify-between items-center mt-3 mb-6'>
                {/* 👇 2. Title Text Dark Mode */}
                <p className='text-xl font-semibold dark:text-white'>
                  {playerData.chapter}.{playerData.lecture} {playerData.lectureTitle}
                </p>
                <button onClick={() => markLectureAsCompleted(playerData.lectureId)} className='text-blue-600 dark:text-blue-400 font-medium hover:underline'>
                  {progressData && progressData.lectureCompleted.includes(playerData.lectureId) ? 'Completed ✅' : 'Mark Complete'}
                </button>
              </div>

              {/* AI Smart Notes Section */}
              <CourseNotes 
                  lectureTitle={playerData.lectureTitle} 
                  lectureDescription={courseData.courseDescription} 
              />

              {/* 👇 3. AI Quiz Section Wrapper Dark Mode Fix */}
              <div className="mt-8 p-5 bg-indigo-50 dark:bg-gray-800 border border-indigo-100 dark:border-gray-700 rounded-lg transition-colors">
                <div className="flex justify-between items-center">
                   <div>
                      <h3 className="font-bold text-lg text-indigo-900 dark:text-indigo-300">Quiz Generator 🤖</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Type any topic to test your knowledge.</p>
                   </div>
                   <button 
                     onClick={() => setShowQuiz(!showQuiz)}
                     className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition duration-200 text-sm shadow-sm"
                   >
                     {showQuiz ? "Close Quiz" : "Take AI Quiz"}
                   </button>
                </div>

                {showQuiz && (
                  // 👇 4. Quiz Inner Container Dark Mode
                  <div className="mt-5 bg-white dark:bg-gray-900 p-4 rounded shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                    <Quiz />
                  </div>
                )}
              </div>

            </div>
          ) : (
            courseData.courseThumbnail && <img src={courseData.courseThumbnail} className="rounded-md shadow-md" alt="Course Thumbnail" />
          )}
        </div>
      </div>
      <Footer />
    </>
  ) : <Loading />;
};

export default Player;