import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'

const CourseCard = ({ course }) => {

    const { currency, calculateRating } = useContext(AppContext)

    return (
        // 👇 CHANGE 1: Card ke wrapper me bg-white, dark:bg-gray-800 aur border/shadow transition add kiya
        <Link 
            onClick={() => scrollTo(0, 0)} 
            to={'/course/' + course._id} 
            className="border border-gray-500/30 dark:border-gray-700 bg-white dark:bg-gray-800 pb-6 overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg dark:hover:shadow-indigo-500/20"
        >
            <img className="w-full" src={course.courseThumbnail} alt='' />
            <div className="p-3 text-left">
                
                {/* 👇 CHANGE 2: Title dark mode me white ho jayega */}
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {course.courseTitle}
                </h3>
                
                {/* 👇 CHANGE 3: Educator name thoda light gray ho jayega */}
                <p className="text-gray-500 dark:text-gray-400">
                    {course.educator?.name || "Instructor"}
                </p>

                <div className="flex items-center space-x-2 mt-1">
                    {/* Rating number text */}
                    <p className="text-gray-800 dark:text-gray-200">{calculateRating(course)}</p>
                    <div className="flex">
                        {[...Array(5)].map((_, i) => (
                            <img
                                key={i}
                                className="w-3.5 h-3.5"
                                src={i < Math.floor(calculateRating(course)) ? assets.star : assets.star_blank}
                                alt="star"
                            />
                        ))}
                    </div>
                    {/* Rating count text */}
                    <p className="text-gray-500 dark:text-gray-400">({course.courseRatings.length})</p>
                </div>

                {/* 👇 CHANGE 4: Price text dark mode me white ho jayega */}
                <p className="text-base font-semibold text-gray-800 dark:text-white mt-2">
                    {currency}
                    {(
                        course.coursePrice - 
                        ((course.discount || 0) * course.coursePrice / 100)
                    ).toFixed(2)}
                </p>
            </div>
        </Link>
    )
}

export default CourseCard