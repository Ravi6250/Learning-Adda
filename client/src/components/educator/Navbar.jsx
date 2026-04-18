import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import { Link } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { UserButton, useUser } from '@clerk/clerk-react';
// 👇 1. ThemeToggle import kiya (Path check karlena)
import ThemeToggle from '../ThemeToggle'; 

const Navbar = ({ bgColor }) => {

  const { isEducator } = useContext(AppContext)
  const { user } = useUser()

  return isEducator && user && (
    // 👇 2. bg, border aur transition dark mode ke liye set kiya
    <div className={`flex items-center justify-between px-4 md:px-8 border-b border-gray-500 dark:border-gray-700 py-3 transition-colors duration-300 ${bgColor} dark:bg-gray-900`}>
      <Link to="/">
          {/* 👇 3. Title color dark mode me white kiya */}
          <h1 className="text-2xl font-bold text-black dark:text-white">Learning Adda</h1>
      </Link>
      
      {/* 👇 4. Text color dark mode me light gray kiya */}
      <div className="flex items-center gap-5 text-gray-500 dark:text-gray-300 relative">
        <p>Hi! {user.fullName}</p>
        
        {/* 👇 5. Dark Mode Toggle Button yahan lagaya */}
        <ThemeToggle />
        
        <UserButton />
      </div>
    </div>
  );
};

export default Navbar;