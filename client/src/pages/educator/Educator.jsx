import React from 'react'
import { Outlet } from 'react-router-dom'
import SideBar from '../../components/educator/SideBar'
import Navbar from '../../components/educator/Navbar'
import Footer from '../../components/educator/Footer'

const Educator = () => {
    return (
        // 👇 YAHAN CHANGE KIYA HAI: bg-white ke sath dark classes aur transition add kiya
        <div className="text-default min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
            <Navbar />
            <div className='flex'>
                <SideBar />
                
                {/* Yahan par baaki saare educator pages load honge (Dashboard, AddCourse) */}
                <div className='flex-1 pb-10'>
                    <Outlet />
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default Educator