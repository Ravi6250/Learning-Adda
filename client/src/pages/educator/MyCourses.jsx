import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import Loading from '../../components/student/Loading'
// Link component import karna zaroori hai clickable banane ke liye
import { Link } from 'react-router-dom' 

const MyCourses = () => {

  const { backendUrl, isEducator, currency, getToken } = useContext(AppContext)
  const [courses, setCourses] = useState(null)

  const fetchEducatorCourses = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(backendUrl + '/api/educator/courses',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        setCourses(data.courses)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (isEducator) {
      fetchEducatorCourses()
    }
  }, [isEducator])

  return courses ? (
    // 👇 1. Main container me transition lagaya
    <div className='h-screen flex-1 flex flex-col gap-5 md:p-8 md:pb-0 p-4 pt-8 pb-0 overflow-scroll transition-colors duration-300'>
      <div className='w-full'>
        {/* 👇 2. Heading text color */}
        <h2 className="pb-4 text-lg font-medium dark:text-white">My Courses</h2>
        
        {/* 👇 3. Table Container Dark Mode Fix */}
        <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white dark:bg-gray-800 border border-gray-500/20 dark:border-gray-700 transition-colors duration-300">
          <table className="md:table-auto table-fixed w-full overflow-hidden">
            {/* 👇 4. Table Header Dark Mode Fix */}
            <thead className="text-gray-900 dark:text-gray-200 border-b border-gray-500/20 dark:border-gray-700 text-sm text-left">
              <tr>
                <th className="px-4 py-3 font-semibold truncate">All Courses</th>
                <th className="px-4 py-3 font-semibold truncate">Earnings</th>
                <th className="px-4 py-3 font-semibold truncate">Students</th>
                <th className="px-4 py-3 font-semibold truncate">Published On</th>
              </tr>
            </thead>
            
            {/* 👇 5. Table Body Dark Mode Fix */}
            <tbody className="text-sm text-gray-500 dark:text-gray-400">
              {courses.map((course) => (
                // 👇 6. Table Row pe border fix aur hover effect daala
                <tr key={course._id} className="border-b border-gray-500/20 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="md:px-4 px-2 py-3 flex items-center space-x-3 truncate">
                    
                    {/* --- IMAGE KO CLICKABLE BANAYA --- */}
                    <Link to={`/course/${course._id}`}>
                       <img src={course.courseThumbnail} alt="Course Image" className="w-16 sm:w-24 h-16 sm:h-24 object-cover rounded-md cursor-pointer hover:scale-105 transition-all" />
                    </Link>

                    <div className='flex flex-col truncate'>
                      {/* --- NAME KO CLICKABLE BANAYA (Dark mode colors updated) --- */}
                      <Link 
                        to={`/course/${course._id}`} 
                        className="font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer truncate transition-colors"
                      >
                        {course.courseTitle}
                      </Link>
                      
                      <span className='text-xs text-gray-500 dark:text-gray-400'>{new Date(course.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3 truncate">
                    {currency} {Math.floor(course.enrolledStudents.length * (course.coursePrice - course.discount * course.coursePrice / 100))}
                  </td>
                  <td className="px-4 py-3 truncate">{course.enrolledStudents.length}</td>
                  <td className="px-4 py-3 truncate">{new Date(course.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : <Loading />
}

export default MyCourses