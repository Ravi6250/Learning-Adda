import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import axios from 'axios';

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
         // Empty object as body if your endpoint doesn't need data
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
    <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-500 py-4 ${isCoursesListPage ? 'bg-white' : 'bg-cyan-100/70'}`}>
      {/* <img 
        onClick={() => navigate('/')} 
        src={assets.logo} 
        alt="Logo" 
        className="w-28 lg:w-32 cursor-pointer" 
      /> */}
      <h1 className="text-2xl font-bold text-dark">Learning Adda</h1>
      
      {/* Desktop Navigation */}
      <div className="md:flex hidden items-center gap-5 text-gray-500">
        <div className="flex items-center gap-5">
          {user && (
            <>
              <button 
                onClick={becomeEducator}
                className="hover:text-blue-600 transition-colors"
              >
                {isEducator ? 'Educator Dashboard' : 'Become Educator'}
              </button>
              | <Link to='/my-enrollments' className="hover:text-blue-600 transition-colors">My Enrollments</Link>
            </>
          )}
        </div>
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
      <div className="md:hidden flex items-center gap-2 sm:gap-5 text-gray-500">
        <div className="flex items-center gap-1 sm:gap-2 max-sm:text-xs">
          {user && (
            <>
              <button 
                onClick={becomeEducator}
                className="hover:text-blue-600 transition-colors"
              >
                {isEducator ? 'Educator' : 'Become Educator'}
              </button>
              | <Link to='/my-enrollments' className="hover:text-blue-600 transition-colors">My Courses</Link>
            </>
          )}
        </div>
        {user ? (
          <UserButton />
        ) : (
          <button onClick={() => openSignIn()}>
            <img src={assets.user_icon} alt="User icon" className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;