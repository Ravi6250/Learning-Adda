import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';

const Dashboard = () => {

  const { backendUrl, isEducator, currency, getToken } = useContext(AppContext)
  const [dashboardData, setDashboardData] = useState(null)

  const fetchDashboardData = async () => {
    try {
      const token = await getToken()
      
      const { data } = await axios.get(backendUrl + '/api/educator/dashboard',
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        setDashboardData(data.dashboardData)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (isEducator) {
      fetchDashboardData()
    }
  }, [isEducator])

  if (!dashboardData) {
    return <Loading />
  }

  return (
    <div className='min-h-screen flex flex-col items-start justify-between gap-8 md:p-8 md:pb-0 p-4 pt-8 pb-0 transition-colors duration-300'>
      <div className='space-y-5 w-full'>
        
        {/* --- Stats Section --- */}
        <div className='flex flex-wrap gap-5 items-center'>
          
          {/* Total Enrolments */}
          {/* 👇 1. Cards ka background dark me gray-800 kiya aur border halka kiya */}
          <div className='flex items-center gap-3 shadow-card border border-blue-500 dark:border-blue-400 bg-white dark:bg-gray-800 p-4 w-56 rounded-md transition-colors'>
            {/* 👇 2. Icons ko dark mode me invert kiya taaki black background pe safed dikhe */}
            <img src={assets.patients_icon} alt="patients_icon" className="dark:invert opacity-80" />
            <div>
              <p className='text-2xl font-medium text-gray-600 dark:text-white'>
                {dashboardData.enrolledStudentsData ? dashboardData.enrolledStudentsData.length : 0}
              </p>
              <p className='text-base text-gray-500 dark:text-gray-400'>Total Enrolments</p>
            </div>
          </div>

          {/* Total Courses */}
          <div className='flex items-center gap-3 shadow-card border border-blue-500 dark:border-blue-400 bg-white dark:bg-gray-800 p-4 w-56 rounded-md transition-colors'>
            <img src={assets.appointments_icon} alt="patients_icon" className="dark:invert opacity-80" />
            <div>
              <p className='text-2xl font-medium text-gray-600 dark:text-white'>
                 {dashboardData.totalCourses}
              </p>
              <p className='text-base text-gray-500 dark:text-gray-400'>Total Courses</p>
            </div>
          </div>

          {/* Total Earnings */}
          <div className='flex items-center gap-3 shadow-card border border-blue-500 dark:border-blue-400 bg-white dark:bg-gray-800 p-4 w-56 rounded-md transition-colors'>
            <img src={assets.earning_icon} alt="patients_icon" className="dark:invert opacity-80" />
            <div>
              <p className='text-2xl font-medium text-gray-600 dark:text-white'>
                {currency}{Math.floor(dashboardData.totalEarnings)}
              </p>
              <p className='text-base text-gray-500 dark:text-gray-400'>Total Earnings</p>
            </div>
          </div>
        </div>

        {/* --- Table Section --- */}
        <div>
          {/* 👇 3. Heading aur Table text colors fix kiye */}
          <h2 className="pb-4 text-lg font-medium dark:text-white">Latest Enrolments</h2>
          <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white dark:bg-gray-800 border border-gray-500/20 dark:border-gray-700 transition-colors">
            <table className="table-fixed md:table-auto w-full overflow-hidden">
              <thead className="text-gray-900 dark:text-gray-200 border-b border-gray-500/20 dark:border-gray-700 text-sm text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">#</th>
                  <th className="px-4 py-3 font-semibold">Student Name</th>
                  <th className="px-4 py-3 font-semibold">Course Title</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-500 dark:text-gray-400">
                {dashboardData.enrolledStudentsData && dashboardData.enrolledStudentsData.length > 0 ? (
                    dashboardData.enrolledStudentsData.map((item, index) => (
                    // 👇 4. Rows ki border dark mode me halki gray ki
                    <tr key={index} className="border-b border-gray-500/20 dark:border-gray-700">
                        <td className="px-4 py-3 text-center hidden sm:table-cell">{index + 1}</td>
                        <td className="md:px-4 px-2 py-3 flex items-center space-x-3">
                        <img
                            src={item.student ? item.student.imageUrl : assets.profile_img}
                            alt="Profile"
                            className="w-9 h-9 rounded-full"
                        />
                        <span className="truncate dark:text-gray-300">
                            {item.student ? item.student.name : 'Unknown Student'}
                        </span>
                        </td>
                        <td className="px-4 py-3 truncate dark:text-gray-300">{item.courseTitle}</td>
                    </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="3" className="text-center py-4 text-gray-400 dark:text-gray-500">
                            No enrollments found
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard