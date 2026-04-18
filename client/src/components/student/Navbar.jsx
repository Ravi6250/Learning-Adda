import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import axios from 'axios';
// 👇 1. ThemeToggle import karo (Path check karlena jahan file save ki hai)
import ThemeToggle from '../ThemeToggle'; 

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isCoursesListPage = location.pathname.includes('/course-list');

  const { backendUrl, isEducator, setIsEducator, getToken } = useContext(AppContext);
  const { openSignIn } = useClerk();
  const { user } = useUser();

  const becomeEducator = async () => {
    try {
      if (isEducator) {
        navigate('/educator');
        return;
      }

      const token = await getToken();
      console.log(token)
      const { data } = await axios.get(
        `${backendUrl}/api/educator/update-role`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials:true,
        }
      );
      
      if (data.success) {
        toast.success(data.message);
        setIsEducator(true);
        navigate('/educator');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Educator role update failed:', error);
      toast.error(
        error.response?.data?.message || 
        error.message || 
        'Failed to update educator role'
      );
    }
  };

  return (
    // 👇 2. Navbar ke background aur border ko dark mode (dark:bg-gray-900) friendly banaya
    <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-500 dark:border-gray-700 py-4 transition-colors duration-300 ${isCoursesListPage ? 'bg-white dark:bg-gray-900' : 'bg-cyan-100/70 dark:bg-gray-800'}`}>
      
      {/* 👇 3. Title text color ko dark mode mein white kiya */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer" onClick={() => navigate('/')}>
        Learning Adda
      </h1>
      
      {/* Desktop Navigation */}
      <div className="md:flex hidden items-center gap-5 text-gray-500 dark:text-gray-300">
        <div className="flex items-center gap-5">
          {user && (
            <>
              <button 
                onClick={becomeEducator}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {isEducator ? 'Educator Dashboard' : 'Become Educator'}
              </button>
              | <Link to='/my-enrollments' className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">My Enrollments</Link>
            </>
          )}
        </div>
        
        {/* 👇 4. ThemeToggle Button yahan lagaya Desktop ke liye */}
        <ThemeToggle />

        {user ? (
          <UserButton />
        ) : (
          <button 
            onClick={() => openSignIn()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full transition-colors"
          >
            Create Account
          </button>
        )}
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden flex items-center gap-2 sm:gap-5 text-gray-500 dark:text-gray-300">
        <div className="flex items-center gap-1 sm:gap-2 max-sm:text-xs">
          {user && (
            <>
              <button 
                onClick={becomeEducator}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {isEducator ? 'Educator' : 'Become Educator'}
              </button>
              | <Link to='/my-enrollments' className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">My Courses</Link>
            </>
          )}
        </div>

        {/* 👇 5. ThemeToggle Button yahan lagaya Mobile ke liye */}
        <ThemeToggle />

        {user ? (
          <UserButton />
        ) : (
          <button onClick={() => openSignIn()}>
            <img src={assets.user_icon} alt="User icon" className="w-6 h-6 dark:invert" /> {/* dark:invert black icon ko white kar dega */}
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;