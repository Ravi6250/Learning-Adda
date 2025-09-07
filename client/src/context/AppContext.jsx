import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth, useUser } from "@clerk/clerk-react";
import humanizeDuration from "humanize-duration";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const currency = import.meta.env.VITE_CURRENCY;

  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [showLogin, setShowLogin] = useState(false);
  const [isEducator, setIsEducator] = useState(false);
  const [allCourses, setAllCourses] = useState([]);
  const [userData, setUserData] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  
  // Fetch All Courses
  const fetchAllCourses = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/course/all`);
      if (data.success) {
        setAllCourses(data.courses);
      } else {
        toast.error(data.message || "Failed to fetch courses");
      }
    } catch (error) {
      console.error("Fetch All Courses Error:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch courses");
    }
  };

  // Fetch UserData 
  const fetchUserData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/user/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUserData(data.user);
        if (user?.publicMetadata?.role === "educator") {
          setIsEducator(true);
        }
      } else {
        toast.error(data.message || "Failed to fetch user data");
      }
    } catch (error) {
      console.error("Fetch User Data Error:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch user data");
    }
  };

  // Fetch User Enrolled Courses
  const fetchUserEnrolledCourses = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/user/enrolled-courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setEnrolledCourses(data.enrolledCourses.reverse());
      } else {
        toast.error(data.message || "Failed to fetch enrolled courses");
      }
    } catch (error) {
      console.error("Fetch Enrolled Courses Error:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch enrolled courses");
    }
  };

  // Calculate Time for Chapter
  const calculateChapterTime = (chapter) => {
    let time = 0;
    chapter.chapterContent.forEach((lecture) => {
      time += lecture.lectureDuration;
    });
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  // Calculate Total Course Duration
  const calculateCourseDuration = (course) => {
    let time = 0;
    course.courseContent.forEach((chapter) =>
      chapter.chapterContent.forEach((lecture) => {
        time += lecture.lectureDuration;
      })
    );
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  // Calculate Course Rating
  const calculateRating = (course) => {
    if (course.courseRatings.length === 0) return 0;
    const total = course.courseRatings.reduce((sum, rating) => sum + rating.rating, 0);
    return Math.floor(total / course.courseRatings.length);
  };

  // Count Total Lectures
  const calculateNoOfLectures = (course) => {
    return course.courseContent.reduce((count, chapter) => {
      return count + (Array.isArray(chapter.chapterContent) ? chapter.chapterContent.length : 0);
    }, 0);
  };

  // Handle Becoming an Educator
  const becomeEducator = async () => {
    try {
      if (isEducator) {
        navigate("/educator");
        return;
      }

      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/educator/update-role`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success(data.message || "You are now an educator!");
        setIsEducator(true);
        navigate("/educator");
      } else {
        toast.error(data.message || "Failed to update role");
      }
    } catch (error) {
      console.error("Become Educator Error:", error);
      if (error.response) {
        toast.error(error.response.data?.message || "Server returned an error");
      } else if (error.request) {
        toast.error("No response from server. Please check backend URL and CORS.");
      } else {
        toast.error("Error: " + error.message);
      }
    }
  };

  useEffect(() => {
    fetchAllCourses();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchUserEnrolledCourses();
    }
  }, [user]);

  const value = {
    showLogin,
    setShowLogin,
    backendUrl,
    currency,
    navigate,
    userData,
    setUserData,
    getToken,
    allCourses,
    fetchAllCourses,
    enrolledCourses,
    fetchUserEnrolledCourses,
    calculateChapterTime,
    calculateCourseDuration,
    calculateRating,
    calculateNoOfLectures,
    isEducator,
    setIsEducator,
    becomeEducator,
  };

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};

