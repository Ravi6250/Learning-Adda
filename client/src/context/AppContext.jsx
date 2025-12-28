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
    const { user, isLoaded } = useUser();

    const [isEducator, setIsEducator] = useState(false);
    const [allCourses, setAllCourses] = useState([]);
    const [userData, setUserData] = useState(null);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [isUserLoading, setIsUserLoading] = useState(true);

    // --- 1. Fetch All Courses (Public) ---
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

    // --- 2. Fetch User Data ---
    const fetchUserData = async () => {
        if (!user) return;
        setIsUserLoading(true);
        try {
            const token = await getToken();
            const { data } = await axios.get(`${backendUrl}/api/user/data`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.success) {
                setUserData(data.user);
                // Role check from Clerk Metadata
                if (user.publicMetadata?.role === "educator") {
                    setIsEducator(true);
                } else {
                    setIsEducator(false);
                }
            } else {
                setUserData({});
            }
        } catch (error) {
            if (error.response?.status === 404) {
                console.warn("User not found in DB.");
                setUserData({});
            } else {
                console.error("Fetch User Data Error:", error);
            }
        } finally {
            setIsUserLoading(false);
        }
    };

    // --- 3. Fetch Enrolled Courses ---
    const fetchUserEnrolledCourses = async () => {
        // Agar user logged in nahi hai ya loading hai, toh run mat karo
        if(!user && !isLoaded) return; 

        try {
            const token = await getToken();
            const { data } = await axios.get(`${backendUrl}/api/user/enrolled-courses`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.success) {
                // Reverse isliye taaki latest course sabse pehle dikhe
                setEnrolledCourses(data.enrolledCourses.reverse());
            } else {
                toast.error(data.message || "Failed to fetch enrolled courses");
            }
        } catch (error) {
            console.error("Fetch Enrolled Courses Error:", error);
            toast.error(error?.response?.data?.message || "Failed to fetch enrolled courses");
        }
    };

    // --- Helper Functions (MOVED INSIDE COMPONENT) ---

    const calculateChapterTime = (chapter) => {
        if (!chapter || !chapter.chapterContent) return 'N/A';
        let time = 0;
        chapter.chapterContent.forEach((lecture) => { time += lecture.lectureDuration; });
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    const calculateCourseDuration = (course) => {
        if (!course || !course.courseContent) return 'N/A';
        let time = 0;
        course.courseContent.forEach((chapter) => chapter.chapterContent.forEach((lecture) => { time += lecture.lectureDuration; }));
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    const calculateRating = (course) => {
        if (!course || !course.courseRatings || course.courseRatings.length === 0) return 0;
        const total = course.courseRatings.reduce((sum, rating) => sum + rating.rating, 0);
        return Math.floor(total / course.courseRatings.length);
    };

    const calculateNoOfLectures = (course) => {
        if (!course || !course.courseContent) return 0;
        return course.courseContent.reduce((count, chapter) => count + (Array.isArray(chapter.chapterContent) ? chapter.chapterContent.length : 0), 0);
    };

    // --- Effects ---

    useEffect(() => {
        fetchAllCourses();
    }, []);

    useEffect(() => {
        if (isLoaded && user) {
            fetchUserData();
            fetchUserEnrolledCourses();
        } else if (isLoaded && !user) {
            setUserData(null);
            setIsEducator(false);
            setEnrolledCourses([]);
        }
    }, [user, isLoaded]);

    const value = {
        backendUrl,
        currency,
        navigate,
        userData,
        setUserData,
        getToken,
        allCourses,
        fetchAllCourses,
        enrolledCourses,
        fetchUserEnrolledCourses, // <--- Ye function export ho raha hai
        calculateChapterTime,
        calculateCourseDuration,
        calculateRating,
        calculateNoOfLectures,
        isEducator,
        setIsEducator,
        isUserLoading,
    };

    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};