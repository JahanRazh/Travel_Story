import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import TravelStoryCard from '../../components/Cards/TravelStoryCard';

const Home = () => {
  const navigate = useNavigate();
  const [userInfo, setUserinfo] = useState(null);
  const [allstories, setAllstories] = useState([]); // Initialize as an empty array
  const [loading, setLoading] = useState(true); // Add loading state

  // Get user info
  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user"); // Use axiosInstance
      if (response.data && response.data.user) {
        setUserinfo(response.data.user);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
      console.error("Error fetching user info:", error);
    }
  };

  // Get all travel stories
  const getAllTravelStories = async () => {
    try {
      const response = await axiosInstance.get("get-all-travel-stories");
      if (response.data && response.data.stories) {
        setAllstories(response.data.stories);
      }
    } catch (error) {
      console.error("An error occurred while fetching stories:", error);
    } finally {
      setLoading(false); // Set loading to false after fetching
    }
  };

  useEffect(() => {
    getAllTravelStories();
    getUserInfo();
  }, []);

  return (
    <>
      <Navbar userInfo={userInfo} />

      <div className='container mx-auto px-10'>
        <div className='flex gap-7'>
          <div className='flex-1'>
            {loading ? (
              <p>Loading...</p>
            ) : allstories?.length > 0 ? (
              <div className='grid grid-cols-1 gap-4'>
                {allstories.map((item) => (
                  <TravelStoryCard key={item.id} />
                ))}
              </div>
            ) : (
              <p>No stories available.</p>
            )}
          </div>
          <div className="w-[320px]">
            {/* Additional content can go here */}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;