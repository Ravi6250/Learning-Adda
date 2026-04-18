import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';

const SideBar = () => {

  const { isEducator } = useContext(AppContext)

  const menuItems = [
    { name: 'Dashboard', path: '/educator', icon: assets.home_icon },
    { name: 'Add Course', path: '/educator/add-course', icon: assets.add_icon },
    { name: 'My Courses', path: '/educator/my-courses', icon: assets.my_course_icon },
    { name: 'Student Enrolled', path: '/educator/student-enrolled', icon: assets.person_tick_icon },
  ];

  return isEducator && (
    // 👇 1. Sidebar ke border ko dark mode me adjust kiya (dark:border-gray-700)
    <div className='md:w-64 w-16 border-r min-h-screen text-base border-gray-500 dark:border-gray-700 py-2 flex flex-col transition-colors duration-300'>
      {menuItems.map((item) => (
        <NavLink
          to={item.path}
          key={item.name}
          end={item.path === '/educator'} // Add end prop for the Dashboard link
          className={({ isActive }) =>
            // 👇 2. Active aur Inactive links ke hover/bg colors dark mode me set kiye
            `flex items-center md:flex-row flex-col md:justify-start justify-center py-3.5 md:px-10 gap-3 transition-colors duration-200 ${isActive
              ? 'bg-indigo-50 dark:bg-indigo-900/30 border-r-[6px] border-indigo-500/90 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
              : 'hover:bg-gray-100/90 dark:hover:bg-gray-800 border-r-[6px] border-white dark:border-gray-900 hover:border-gray-100/90 dark:hover:border-gray-800 text-gray-700 dark:text-gray-300'
            }`
          }
        >
          {/* 👇 3. Icons ko dark mode aate hi white karne ke liye (dark:invert) lagaya */}
          <img src={item.icon} alt="" className="w-6 h-6 dark:invert opacity-80" />
          <p className='md:block hidden text-center font-medium'>{item.name}</p>
        </NavLink>
      ))}
    </div>
  );
};

export default SideBar;