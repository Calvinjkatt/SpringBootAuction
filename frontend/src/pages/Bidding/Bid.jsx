import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import axiosInstance from '../../utils/axiosinstance';

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='max-w-screen-md mx-auto px-4 mt-6'>
          <h1 className='text-red-500'>Something went wrong. Please refresh the page.</h1>
        </div>
      );
    }
    return this.props.children;
  }
}

function Bid() {
  const { auctionId } = useParams();
  const [auctionItem, setAuctionItem] = useState(null);
  const [auctionStatus, setAuctionStatus] = useState(null);
  const [highestBid, setHighestBid] = useState(null);
  const [winningBid, setWinningBid] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('Loading...');
  const navigate = useNavigate();
  const isOwnAuction = auctionItem && userId === auctionItem.userId;
  const isAuctionEnded = timeRemaining === 'Auction Ended';
  const [winnerExists, setWinnerExists] = useState(false);

  useEffect(() => {
    fetchUserSession();
    fetchAuctionItem();
    fetchAuctionStatus();
    fetchHighestBid();

    // Poll only if auction hasn't ended
    if (!isAuctionEnded) {
      const interval = setInterval(() => {
        fetchAuctionStatus();
        fetchHighestBid();
      }, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [auctionId, isAuctionEnded]);
  
  const handleSubmit = async () => {
    console.log("handleSubmit called!"); // Log when called
    console.log("Winning bid details:", winningBid);

    if (!winningBid?.user || !auctionItem?.auctionItemId || !highestBid?.bidAmount) {
      console.error("Error: Missing required data. Cannot submit winner.");
      return;
    }
	
    const formData = new URLSearchParams();
    formData.append("userId", winningBid.user.userId);
    formData.append("auctionItemId", auctionItem.auctionItemId);
    formData.append("winningPrice", highestBid.bidAmount);

    try {
      const response = await axiosInstance.post(
        "http://localhost:8080/api/winners/add",
        formData,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      console.log("Winner added successfully", response.data);
      setSuccessMessage("Winner added successfully!");
    } catch (err) {
      console.error("Error adding winner:", err);
      setError(err.response?.data?.message || "An error occurred.");
    }
  };



  useEffect(() => {
    if (!auctionStatus) {
      setTimeRemaining('Loading auction status...');
      return;
    }

    const endDate = auctionStatus?.endTimeEpoch;
    if (!endDate) {
      setTimeRemaining('End date not available');
      return;
    }
	
    const endDateInMs = parseInt(endDate) * 1000;
	const updateTimer = () => {
	  const now = new Date().getTime();
	  const totalSeconds = Math.floor((endDateInMs - now) / 1000);

	  if (totalSeconds <= 0) {
	    setTimeRemaining('Auction Ended');
	    
	    if (highestBid) {
	      setWinningBid(highestBid);
	      if (highestBid.userId) { // Ensure userId exists
	        handleSubmit();
	      }
	    }
	    return;
	  }

	  const days = Math.floor(totalSeconds / (24 * 60 * 60));
	  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
	  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
	  const seconds = totalSeconds % 60;

	  setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
	};


    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    return () => clearInterval(timerInterval);
  }, [auctionStatus, highestBid]);

  const checkWinner = async () => {
  	  try {
  	    // Call the API to get the winner for the auction
  	    const response = await axiosInstance.get(`/api/winners/${auctionId}`);
  	    if (response.data) {
  	      setWinnerExists(true); // Winner already exists
  	    } else {
  	      setWinnerExists(false); // No winner yet
  	    }
  	  } catch (err) {
  	    console.error("Error checking winner:", err);
  	    setWinnerExists(false); // Assume no winner if error occurs
  	  }
  	};
	
  useEffect(() => {
	checkWinner();
    if (timeRemaining === "Auction Ended" && highestBid) {
      
      setWinningBid(highestBid); // Ensure winningBid is set before submitting
      if (highestBid.user && !winnerExists) {
        handleSubmit();
      }
    }
  }, [timeRemaining, highestBid]); 

  
  useEffect(() => {
    if (isAuctionEnded && winningBid) {
      setTimeout(() => {
        navigate('/bidend', {
          state: {
            auctionItemId: auctionId,
            winningBid,
          },
        });
      }, 5000); // Delay to show winning bid before redirect
    }
  }, [isAuctionEnded, winningBid, navigate, auctionId]);
  
  

  const fetchUserSession = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/users/me', { credentials: 'include' });
      if (!res.ok) throw new Error('User session not found. Please log in.');
      const data = await res.json();
      setUserId(data.userId || data.user_id);
    } catch (err) {
      handleError(err, 'Error fetching user session.');
    }
  };

  const fetchAuctionItem = async () => {
    try {
      const response = await axiosInstance.get(`/api/auction-items/${auctionId}`);
      setAuctionItem(response.data);
    } catch (err) {
      handleError(err, 'Error fetching auction item.');
    }
  };

  const fetchAuctionStatus = async () => {
    try {
      const response = await axiosInstance.get(`/api/auction-status/${auctionId}`);
      setAuctionStatus(response.data);
    } catch (err) {
      handleError(err, 'Error fetching auction status.');
    }
  };

  const fetchHighestBid = async () => {
    try {
      const response = await axiosInstance.get(`/api/bids/auction/${auctionId}/highest`);
      setHighestBid(response.data);
    } catch (err) {
      handleError(err, 'Error fetching highest bid.');
    }
  };

  const handleError = (error, defaultMessage) => {
    const message = error.response?.data?.message || defaultMessage;
    setError(message);
    setTimeout(() => setError(null), 3000);
  };

  const handleBuyNow = async () => {
    if (!userId) {
      setError('You must be logged in to purchase.');
      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('userId', userId);
      formData.append('auctionItemId', auctionId);

      await axiosInstance.post('/api/bids/buy-now', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      setSuccessMessage('Item purchased successfully!');
      setTimeout(() => {
        navigate('/bidend', {
          state: { auctionItemId: auctionId },
        });
      }, 1000);
    } catch (err) {
      handleError(err, 'Failed to complete purchase.');
    }
  };

  const handlePlaceBid = async () => {
    if (!userId) {
      setError('You must be logged in to place a bid.');
      return;
    }

    if (isOwnAuction) {
      setError('You cannot bid on your own auction.');
      return;
    }

    if (!bidAmount || isNaN(bidAmount) || bidAmount <= 0) {
      setError('Please enter a valid bid amount.');
      return;
    }

    const minBid = highestBid ? highestBid.bidAmount + 1 : auctionItem.startingPrice;
    if (parseFloat(bidAmount) < minBid) {
      setError(`Your bid must be at least $${minBid}.`);
      return;
    }

    if (auctionItem.buyNowPrice && parseFloat(bidAmount) >= auctionItem.buyNowPrice) {
      setError(
        `Your bid is above the Buy Now price ($${auctionItem.buyNowPrice}). ` +
        `Please click "Buy Now" to purchase immediately.`
      );
      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('userId', userId);
      formData.append('auctionItemId', auctionId);
      formData.append('bidAmount', bidAmount);

      await axiosInstance.post('/api/bids/add', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      setBidAmount('');
      setSuccessMessage('Bid placed successfully!');
      fetchHighestBid();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      handleError(err, 'Failed to place bid.');
    }
  };

  if (!auctionItem && !error) {
    return (
      <ErrorBoundary>
        <Navbar />
        <div className='max-w-screen-md mx-auto px-4 mt-6'>
          <p>Loading...</p>
        </div>
      </ErrorBoundary>
    );
  }

  if (error && !auctionItem) {
    return (
      <ErrorBoundary>
        <Navbar />
        <div className='max-w-screen-md mx-auto px-4 mt-6'>
          <p className='text-red-500'>Failed to load auction item: {error}</p>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Navbar />
      <div className='max-w-screen-md mx-auto px-4 mt-6'>
        {error && <p className='text-red-500 mb-4'>{error}</p>}
        {successMessage && <p className='text-green-500 mb-4'>{successMessage}</p>}

        <h1 className='text-2xl font-bold'>{auctionItem.itemName}</h1>
        <p className='mt-2'>{auctionItem.itemDescription}</p>
        <p className='mt-2 font-semibold'>
          Starting Price: ${auctionItem.startingPrice.toLocaleString()}
        </p>
        <p className='mt-2 font-semibold'>
          Highest Bid: {highestBid ? (
            <>
              ${highestBid.bidAmount.toLocaleString()} by User{' '}
              {highestBid.userId === userId ? 'You' : highestBid.userId}
            </>
          ) : (
            'Be the first to bid.'
          )}
        </p>
        {isAuctionEnded && winningBid && (
          <p className='mt-2 font-semibold text-green-600'>
            Winning Bid: ${winningBid.bidAmount.toLocaleString()} by User{' '}
            {winningBid.userId === userId ? 'You' : winningBid.userId}
          </p>
        )}
        <p className='mt-2 font-semibold'>
          Time Remaining: {timeRemaining || 'Calculating...'}
        </p>

        {auctionItem.auctionType?.auctionTypeId === 2 && (
          <button
            className={`mt-4 px-6 py-2 rounded text-white font-semibold ${
              isAuctionEnded ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
            }`}
            onClick={handleBuyNow}
            disabled={isAuctionEnded}
          >
            {isAuctionEnded ? 'Auction Ended' : `Buy Now for $${auctionItem.buyNowPrice}`}
          </button>
        )}

        <div className='mt-6'>
          <h2 className='text-lg font-bold'>Place a Bid</h2>
          {isOwnAuction ? (
            <p className='text-gray-600 mt-2'>You cannot bid on your own product.</p>
          ) : (
            <>
              {isAuctionEnded && <p className='text-red-500 mt-2'>Auction is over. No more bids accepted.</p>}
              <input
                type='number'
                value={bidAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (Number(value) >= 0 && Number.isInteger(Number(value)))) {
                    setBidAmount(value);
                  }
                }}
                placeholder='Enter your bid'
                className={`border p-2 rounded w-full mt-2 ${
                  isAuctionEnded ? 'bg-gray-200 cursor-not-allowed' : ''
                }`}
                disabled={isAuctionEnded}
                min='0'
                step='1'
              />
              <button
                className={`mt-2 px-6 py-2 rounded text-white font-semibold ${
                  isAuctionEnded ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                }`}
                onClick={handlePlaceBid}
                disabled={isAuctionEnded}
              >
                {isAuctionEnded ? 'Auction Ended' : 'Place Bid'}
              </button>
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default Bid;