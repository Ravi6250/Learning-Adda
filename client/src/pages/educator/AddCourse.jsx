import React, { useContext, useEffect, useRef, useState } from 'react';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';
import Quill from 'quill';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';

const AddCourse = () => {

  const editorRef = useRef(null);
  const quillRef = useRef(null);

  const { backendUrl, getToken } = useContext(AppContext);

  const [courseTitle, setCourseTitle] = useState('');
  const [coursePrice, setCoursePrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [image, setImage] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);

  const [lectureToEditIndex, setLectureToEditIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: '',
    lectureDuration: '',
    lectureUrl: '',
    isPreviewFree: false,
  });

  const generateUniqueID = () => {
    return Math.floor(Math.random() * Date.now()).toString(16);
  }

  const autoGenerateCourse = async () => {
    if (!courseTitle) {
      toast.error("Please enter a Topic/Title first!");
      return;
    }
    setIsLoading(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + '/api/educator/generate-ai',
        { topic: courseTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        const { courseData } = data;
        setCourseTitle(courseData.courseTitle);
        setCoursePrice(courseData.coursePrice);
        setDiscount(courseData.discount);

        if (quillRef.current) {
          quillRef.current.root.innerHTML = courseData.courseDescription;
        }

        const formattedChapters = courseData.courseContent.map((chapter, index) => ({
          ...chapter,
          chapterId: generateUniqueID(),
          chapterOrder: index + 1, 
          collapsed: false,
          chapterContent: chapter.chapterContent.map((lecture, lIndex) => ({
            ...lecture,
            lectureId: generateUniqueID(),
            lectureOrder: lIndex + 1 
          }))
        }));

        setChapters(formattedChapters);
        toast.success("Course Auto-Generated! Now Edit details.");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChapter = (action, chapterId) => {
    if (action === 'add') {
      const title = prompt('Enter Chapter Name:');
      if (title) {
        const newChapter = {
          chapterId: generateUniqueID(),
          chapterTitle: title,
          chapterContent: [],
          collapsed: false,
          chapterOrder: chapters.length > 0 ? chapters.slice(-1)[0].chapterOrder + 1 : 1,
        };
        setChapters([...chapters, newChapter]);
      }
    } else if (action === 'remove') {
      setChapters(chapters.filter((chapter) => chapter.chapterId !== chapterId));
    } else if (action === 'toggle') {
      setChapters(
        chapters.map((chapter) =>
          chapter.chapterId === chapterId ? { ...chapter, collapsed: !chapter.collapsed } : chapter
        )
      );
    }
  };

  const handleLecture = (action, chapterId, lectureIndex) => {
    if (action === 'add') {
      setLectureToEditIndex(null);
      setLectureDetails({
        lectureTitle: '',
        lectureDuration: '',
        lectureUrl: '',
        isPreviewFree: false,
      });
      setCurrentChapterId(chapterId);
      setShowPopup(true);
    }
    else if (action === 'remove') {
      setChapters(
        chapters.map((chapter) => {
          if (chapter.chapterId === chapterId) {
            chapter.chapterContent.splice(lectureIndex, 1);
          }
          return chapter;
        })
      );
    }
    else if (action === 'edit') {
      const chapter = chapters.find(c => c.chapterId === chapterId);
      const lecture = chapter.chapterContent[lectureIndex];

      setLectureDetails({
        lectureTitle: lecture.lectureTitle,
        lectureDuration: lecture.lectureDuration,
        lectureUrl: lecture.lectureUrl,
        isPreviewFree: lecture.isPreviewFree,
      });

      setLectureToEditIndex(lectureIndex);
      setCurrentChapterId(chapterId);
      setShowPopup(true);
    }
  };

  const addOrUpdateLecture = () => {
    setChapters(
      chapters.map((chapter) => {
        if (chapter.chapterId === currentChapterId) {
          if (lectureToEditIndex !== null) {
            chapter.chapterContent[lectureToEditIndex] = {
              ...chapter.chapterContent[lectureToEditIndex],
              ...lectureDetails
            };
          }
          else {
            const newLecture = {
              ...lectureDetails,
              lectureOrder: chapter.chapterContent.length > 0 ? chapter.chapterContent.slice(-1)[0].lectureOrder + 1 : 1,
              lectureId: generateUniqueID()
            };
            chapter.chapterContent.push(newLecture);
          }
        }
        return chapter;
      })
    );
    setShowPopup(false);
    setLectureToEditIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!image) {
        toast.error('Thumbnail Not Selected');
        return;
      }

      const courseData = {
        courseTitle,
        courseDescription: quillRef.current.root.innerHTML,
        coursePrice: Number(coursePrice),
        discount: Number(discount),
        courseContent: chapters,
      };

      const formData = new FormData();
      formData.append('courseData', JSON.stringify(courseData)); 
      formData.append('image', image); 

      const token = await getToken();

      const { data } = await axios.post(
        backendUrl + '/api/educator/add-course', 
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setCourseTitle('');
        setCoursePrice(0);
        setDiscount(0);
        setImage(null);
        setChapters([]);
        if(quillRef.current) quillRef.current.root.innerHTML = "";
      } else {
        toast.error(data.message);
      }

    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
      });
    }
  }, []);

  return (
    // 👇 1. Text color updated for dark mode
    <div className='h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0 transition-colors duration-300'>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4 max-w-md w-full text-gray-500 dark:text-gray-400'>

        {/* Course Title */}
        <div className='flex flex-col gap-1'>
          <p className="dark:text-gray-300">Course Title</p>
          <div className='flex gap-2 items-center'>
            {/* 👇 2. Input fields background and border updated */}
            <input onChange={e => setCourseTitle(e.target.value)} value={courseTitle} type="text" placeholder='Type topic here' className='outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex-grow transition-colors' required />
            <button type="button" onClick={autoGenerateCourse} disabled={isLoading} className={`py-2 px-4 rounded text-white font-medium transition-all ${isLoading ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'}`}>
              {isLoading ? 'Generating...' : 'Auto-Generate AI 🪄'}
            </button>
          </div>
        </div>

        {/* Description Editor */}
        <div className='flex flex-col gap-1'>
          <p className="dark:text-gray-300">Course Description</p>
          {/* 👇 3. Quill ko intentionally white background diya hai taaki toolbar visible rahe */}
          <div className="bg-white text-black rounded-md overflow-hidden">
            <div ref={editorRef}></div>
          </div>
        </div>

        {/* Price & Thumbnail */}
        <div className='flex items-center justify-between flex-wrap'>
          <div className='flex flex-col gap-1'>
            <p className="dark:text-gray-300">Course Price</p>
            <input onChange={e => setCoursePrice(e.target.value)} value={coursePrice} type="number" placeholder='0' className='outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors' required />
          </div>
          <div className='flex md:flex-row flex-col items-center gap-3'>
            <p className="dark:text-gray-300">Course Thumbnail</p>
            <label htmlFor='thumbnailImage' className='flex items-center gap-3 cursor-pointer'>
              <img src={assets.file_upload_icon} alt="" className='p-3 bg-blue-500 dark:bg-blue-600 rounded' />
              <input type="file" id='thumbnailImage' onChange={e => setImage(e.target.files[0])} accept="image/*" hidden />
              <img className='max-h-10 rounded' src={image ? URL.createObjectURL(image) : ''} alt="" />
            </label>
          </div>
        </div>

        {/* Discount */}
        <div className='flex flex-col gap-1'>
          <p className="dark:text-gray-300">Discount %</p>
          <input onChange={e => setDiscount(e.target.value)} value={discount} type="number" placeholder='0' min={0} max={100} className='outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors' required />
        </div>

        {/* Chapters List */}
        <div>
          {chapters.map((chapter, chapterIndex) => (
            // 👇 4. Chapters container dark mode
            <div key={chapterIndex} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg mb-4 transition-colors">
              <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                <div className="flex items-center">
                  <img className={`mr-2 cursor-pointer transition-all dark:invert opacity-80 ${chapter.collapsed && "-rotate-90"} `} onClick={() => handleChapter('toggle', chapter.chapterId)} src={assets.dropdown_icon} width={14} alt="" />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{chapterIndex + 1} {chapter.chapterTitle}</span>
                </div>
                <span className="text-gray-500 dark:text-gray-400">{chapter.chapterContent.length} Lectures</span>
                <img onClick={() => handleChapter('remove', chapter.chapterId)} src={assets.cross_icon} alt="" className='cursor-pointer dark:invert opacity-80' />
              </div>
              {!chapter.collapsed && (
                <div className="p-4">
                  {chapter.chapterContent.map((lecture, lectureIndex) => (
                    <div key={lectureIndex} className="flex justify-between items-center mb-2">
                      <span className="text-gray-700 dark:text-gray-300">{lectureIndex + 1} {lecture.lectureTitle} - {lecture.lectureDuration} mins - <a href={lecture.lectureUrl} target="_blank" className="text-blue-500 dark:text-blue-400" rel="noreferrer">Link</a> - {lecture.isPreviewFree ? 'Free Preview' : 'Paid'}</span>
                      <div className='flex items-center gap-2'>
                        <span className='cursor-pointer text-blue-500 dark:text-blue-400 text-sm' onClick={() => handleLecture('edit', chapter.chapterId, lectureIndex)}>Edit</span>
                        <img onClick={() => handleLecture('remove', chapter.chapterId, lectureIndex)} src={assets.cross_icon} alt="" className='cursor-pointer dark:invert opacity-80' />
                      </div>
                    </div>
                  ))}
                  <div className="inline-flex bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-2 rounded cursor-pointer mt-2 transition-colors" onClick={() => handleLecture('add', chapter.chapterId)}>
                    + Add Lecture
                  </div>
                </div>
              )}
            </div>
          ))}
          {/* 👇 5. Add Chapter Button Dark Mode */}
          <div className="flex justify-center items-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium p-2 rounded-lg cursor-pointer transition-colors" onClick={() => handleChapter('add')}>
            + Add Chapter
          </div>

          {/* Popup Modal */}
          {showPopup && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50 transition-opacity">
              {/* 👇 6. Popup Box Dark Mode */}
              <div className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-4 rounded relative w-full max-w-80 shadow-xl border dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4 dark:text-white">{lectureToEditIndex !== null ? 'Update Lecture' : 'Add Lecture'}</h2>
                <div className="mb-2">
                  <p className="dark:text-gray-300">Lecture Title</p>
                  <input type="text" className="mt-1 block w-full border dark:border-gray-600 rounded py-1 px-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors" value={lectureDetails.lectureTitle} onChange={(e) => setLectureDetails({ ...lectureDetails, lectureTitle: e.target.value })} />
                </div>
                <div className="mb-2">
                  <p className="dark:text-gray-300">Duration (minutes)</p>
                  <input type="number" className="mt-1 block w-full border dark:border-gray-600 rounded py-1 px-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors" value={lectureDetails.lectureDuration} onChange={(e) => setLectureDetails({ ...lectureDetails, lectureDuration: e.target.value })} />
                </div>
                <div className="mb-2">
                  <p className="dark:text-gray-300">Lecture URL</p>
                  <input type="text" className="mt-1 block w-full border dark:border-gray-600 rounded py-1 px-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors" value={lectureDetails.lectureUrl} onChange={(e) => setLectureDetails({ ...lectureDetails, lectureUrl: e.target.value })} />
                </div>
                <div className="flex gap-2 my-4">
                  <p className="dark:text-gray-300">Is Preview Free?</p>
                  <input type="checkbox" className='mt-1 scale-125' checked={lectureDetails.isPreviewFree} onChange={(e) => setLectureDetails({ ...lectureDetails, isPreviewFree: e.target.checked })} />
                </div>
                <button type='button' className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors" onClick={addOrUpdateLecture}>
                  {lectureToEditIndex !== null ? 'Update' : 'Add'}
                </button>
                <img onClick={() => { setShowPopup(false); setLectureToEditIndex(null); }} src={assets.cross_icon} className='absolute top-4 right-4 w-4 cursor-pointer dark:invert opacity-80' alt="" />
              </div>
            </div>
          )}
        </div>

        {/* 👇 7. Main Submit Button */}
        <button type="submit" className='bg-black dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 text-white w-max py-2.5 px-8 rounded my-4 transition-colors'>
          ADD COURSE
        </button>
      </form>
    </div>
  );
};

export default AddCourse;