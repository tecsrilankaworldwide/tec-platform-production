import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const PayPalPayment = ({ 
  subscriptionType, 
  ageGroup, 
  onSuccess, 
  onCancel,
  onError 
}) => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [error, setError] = useState(null);
  const paypalContainerRef = useRef(null);
  const sdkInitialized = useRef(false);

  // Get current price based on selection
  const getCurrentPrice = () => {
    if (!pricing || !subscriptionType || !ageGroup) return 0;
    return pricing.prices?.[subscriptionType]?.[ageGroup] || 0;
  };

  // Load PayPal pricing
  useEffect(() => {
    const loadPricing = async () => {
      try {
        const response = await axios.get(`${API}/paypal/pricing`);
        setPricing(response.data);
      } catch (err) {
        console.error('Failed to load PayPal pricing:', err);
        setError('Failed to load pricing information');
      }
    };
    loadPricing();
  }, []);

  // Load PayPal SDK
  useEffect(() => {
    if (sdkInitialized.current) return;
    
    const loadPayPalSDK = async () => {
      try {
        // Get client token from backend
        const tokenResponse = await axios.get(`${API}/paypal/client-token`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        const { client_id, mode } = tokenResponse.data;
        
        // Check if SDK already loaded
        if (window.paypal) {
          setSdkReady(true);
          setLoading(false);
          return;
        }

        // Load PayPal SDK script
        const script = document.createElement('script');
        const baseUrl = mode === 'sandbox' 
          ? 'https://www.sandbox.paypal.com' 
          : 'https://www.paypal.com';
        
        script.src = `${baseUrl}/sdk/js?client-id=${client_id}&currency=USD&intent=capture`;
        script.async = true;
        
        script.onload = () => {
          sdkInitialized.current = true;
          setSdkReady(true);
          setLoading(false);
        };
        
        script.onerror = () => {
          setError('Failed to load PayPal SDK');
          setLoading(false);
        };
        
        document.body.appendChild(script);
        
      } catch (err) {
        console.error('PayPal SDK load error:', err);
        setError('Failed to initialize PayPal');
        setLoading(false);
      }
    };

    loadPayPalSDK();
  }, []);

  // Render PayPal buttons when SDK is ready
  useEffect(() => {
    if (!sdkReady || !window.paypal || !paypalContainerRef.current) return;
    if (!subscriptionType || !ageGroup) return;

    // Clear previous buttons
    paypalContainerRef.current.innerHTML = '';

    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'paypal',
        height: 45
      },
      
      createOrder: async () => {
        setProcessing(true);
        setError(null);
        
        try {
          const response = await axios.post(
            `${API}/paypal/create-order`,
            {
              subscription_type: subscriptionType,
              age_group: ageGroup,
              success_url: window.location.origin + '/subscription?success=true',
              cancel_url: window.location.origin + '/subscription?cancelled=true'
            },
            {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }
          );
          
          return response.data.orderId;
        } catch (err) {
          console.error('Create order error:', err);
          setError('Failed to create payment order');
          setProcessing(false);
          throw err;
        }
      },
      
      onApprove: async (data) => {
        try {
          const response = await axios.post(
            `${API}/paypal/capture-order/${data.orderID}`,
            {},
            {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }
          );
          
          setProcessing(false);
          
          if (response.data.success) {
            onSuccess?.(response.data);
          } else {
            setError(response.data.message || 'Payment was not completed');
            onError?.(response.data);
          }
        } catch (err) {
          console.error('Capture order error:', err);
          setError('Failed to complete payment');
          setProcessing(false);
          onError?.(err);
        }
      },
      
      onCancel: (data) => {
        setProcessing(false);
        onCancel?.(data);
      },
      
      onError: (err) => {
        console.error('PayPal error:', err);
        setError('PayPal encountered an error');
        setProcessing(false);
        onError?.(err);
      }
    }).render(paypalContainerRef.current);

  }, [sdkReady, subscriptionType, ageGroup, onSuccess, onCancel, onError]);

  const price = getCurrentPrice();

  return (
    <div className="paypal-payment-container" data-testid="paypal-payment">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/>
            </svg>
            <div>
              <h3 className="font-bold text-lg">Pay with PayPal</h3>
              <p className="text-blue-100 text-sm">Secure international payment</p>
            </div>
          </div>
          {price > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold">${price.toFixed(2)}</p>
              <p className="text-xs text-blue-100">USD</p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white p-6 rounded-b-xl border border-t-0 border-gray-200">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600">Loading PayPal...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : processing ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600">Processing payment...</p>
            <p className="text-sm text-gray-400 mt-1">Please do not close this window</p>
          </div>
        ) : (
          <>
            {/* PayPal Buttons Container */}
            <div 
              ref={paypalContainerRef} 
              className="paypal-buttons min-h-[50px]"
              data-testid="paypal-buttons"
            ></div>
            
            {/* Info */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Secure payment powered by PayPal
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">
                You can pay with your PayPal balance, bank account, or card
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PayPalPayment;
