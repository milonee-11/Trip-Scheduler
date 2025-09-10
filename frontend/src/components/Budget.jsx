import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Navbar from './Navbar';
import FooterSection from './FooterSection';
import BackToTop from './BackToTop';
import Modal from 'react-modal';
import './Budget.css';

Modal.setAppElement('#root');

const Budget = () => {
  const username = localStorage.getItem("username");
  const navigate = useNavigate();
  const [showThankYou, setShowThankYou] = useState(false);

  // Initialize state
  const [weatherData, setWeatherData] = useState(null);
  const [accommodationData, setAccommodationData] = useState(null);
  const [itineraryData, setItineraryData] = useState(null);
  const [additionalCosts, setAdditionalCosts] = useState({
    food: '',
    transport: '',
    miscellaneous: {
      shopping: '',
      clubbing: '',
      souvenirs: '',
      emergencies: '',
      others: ''
    }
  });
  const [transportType, setTransportType] = useState('public');
  const [foodPreference, setFoodPreference] = useState('mid-range');
  const [days, setDays] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMiscOptions, setShowMiscOptions] = useState(false);

  // Redirect if username missing
  useEffect(() => {
    if (!username) navigate("/");
  }, [username, navigate]);

  // Load saved data
  useEffect(() => {
    if (!username) return;

    const savedWeather = localStorage.getItem(`weatherData_${username}`);
    const savedAccommodation = localStorage.getItem(`accommodation_${username}`);
    const savedItinerary = localStorage.getItem(`savedItineraryData_${username}`);
    const savedAdditionalCosts = localStorage.getItem(`additionalCosts_${username}`);

    if (savedWeather) {
      const weather = JSON.parse(savedWeather);
      setWeatherData(weather);
      const arrival = new Date(weather.arrival);
      const departure = new Date(weather.departure);
      const diffDays = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));
      setDays(diffDays || 1);
    }
    if (savedAccommodation) setAccommodationData(JSON.parse(savedAccommodation));
    if (savedItinerary) setItineraryData(JSON.parse(savedItinerary));
    if (savedAdditionalCosts) {
      const parsed = JSON.parse(savedAdditionalCosts);
      // Handle migration from old format to new format
      if (typeof parsed.miscellaneous === 'number') {
        setAdditionalCosts({
          ...parsed,
          miscellaneous: {
            shopping: '',
            clubbing: '',
            souvenirs: '',
            emergencies: '',
            others: ''
          }
        });
      } else {
        setAdditionalCosts(parsed);
      }
    }

    setTimeout(() => setIsLoading(false), 2500);
  }, [username]);

  // Validate form inputs
  const validateForm = () => {
    const errors = {};
    const { food, transport } = additionalCosts;

    // Food validation
    if (!food || isNaN(food)) {
      errors.food = 'Please enter a valid food budget';
    } else if (foodPreference === 'budget' && (food < 200 || food > 500)) {
      errors.food = 'Budget Eats should be between ₹200-500 per day';
    } else if (foodPreference === 'mid-range' && (food < 500 || food > 1000)) {
      errors.food = 'Mid-Range should be between ₹500-1000 per day';
    } else if (foodPreference === 'luxury' && food < 1000) {
      errors.food = 'Luxury should be ₹1000+ per day';
    }

    // Transport validation
    if (!transport || isNaN(transport)) {
      errors.transport = 'Please enter a valid transport budget';
    } else if (transportType === 'public' && (transport < 50 || transport > 200)) {
      errors.transport = 'Public Transport should be between ₹50-200 per day';
    } else if (transportType === 'rental' && (transport < 500 || transport > 1500)) {
      errors.transport = 'Rental Vehicle should be between ₹500-1500 per day';
    } else if (transportType === 'taxis' && (transport < 300 || transport > 1000)) {
      errors.transport = 'Taxis should be between ₹300-1000 per day';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Calculate total costs
  const calculateTotals = () => {
    const initialBudget = weatherData?.budget || 0;
    const accommodationTotal = accommodationData?.total || 0;
    const attractionsTotal = itineraryData?.totalFee || 0;
    
    const foodTotal = (additionalCosts.food ? Number(additionalCosts.food) : 0) * days;
    const transportTotal = (additionalCosts.transport ? Number(additionalCosts.transport) : 0) * days;
    
    // Calculate miscellaneous total
    const miscValues = Object.values(additionalCosts.miscellaneous)
      .filter(val => val !== '')
      .map(val => Number(val));
    const miscTotal = miscValues.reduce((sum, val) => sum + val, 0);

    const totalSpent = accommodationTotal + attractionsTotal + foodTotal + transportTotal + miscTotal;
    const remainingBudget = initialBudget - totalSpent;

    return {
      initialBudget,
      accommodationTotal,
      attractionsTotal,
      foodTotal,
      transportTotal,
      miscTotal,
      totalSpent,
      remainingBudget,
      budgetHealth: remainingBudget < 0 ? 'over' : 
                   remainingBudget < (initialBudget * 0.1) ? 'warning' : 'healthy'
    };
  };

  const totals = calculateTotals();

  // Prepare data for pie chart
  const pieData = [
    { name: 'Accommodation', value: totals.accommodationTotal },
    { name: 'Attractions', value: totals.attractionsTotal },
    { name: 'Food', value: totals.foodTotal },
    { name: 'Transport', value: totals.transportTotal },
    ...Object.entries(additionalCosts.miscellaneous)
      .filter(([_, value]) => value !== '')
      .map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: Number(value)
      })),
    { name: 'Other Misc', value: totals.miscTotal - Object.values(additionalCosts.miscellaneous)
      .filter(val => val !== '')
      .map(val => Number(val))
      .reduce((sum, val) => sum + val, 0) }
  ].filter(item => item.value > 0);

  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
    '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#8dd1e1'
  ];

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const isValid = validateForm();
    
    if (isValid) {
      setIsSubmitting(true);
      localStorage.setItem(`additionalCosts_${username}`, JSON.stringify(additionalCosts));
      setShowModal(true);
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAdditionalCosts(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle miscellaneous input changes
  const handleMiscChange = (e) => {
    const { name, value } = e.target;
    setAdditionalCosts(prev => ({
      ...prev,
      miscellaneous: {
        ...prev.miscellaneous,
        [name]: value
      }
    }));
  };

  // Handle preference changes
  const handlePreferenceChange = (type, value, defaultValues) => {
    if (type === 'food') {
      setFoodPreference(value);
      setAdditionalCosts(prev => ({
        ...prev,
        food: defaultValues[value]
      }));
    } else {
      setTransportType(value);
      setAdditionalCosts(prev => ({
        ...prev,
        transport: defaultValues[value]
      }));
    }
  };

  // Budget health indicator
  const getBudgetHealthClass = () => {
    switch(totals.budgetHealth) {
      case 'over': return 'budget-over';
      case 'warning': return 'budget-warning';
      default: return 'budget-healthy';
    }
  };

  // Cost-saving suggestions
  const getSuggestions = () => {
    const suggestions = [];
    const overspend = -totals.remainingBudget;

    if (totals.budgetHealth === 'over') {
      suggestions.push(`You're ₹${overspend.toLocaleString()} over budget. Consider:`);

      if (totals.accommodationTotal > (totals.initialBudget * 0.4)) {
        suggestions.push("- Choosing cheaper accommodation (currently " + 
          Math.round((totals.accommodationTotal / totals.initialBudget) * 100) + "% of budget)");
      }

      if (totals.attractionsTotal > (totals.initialBudget * 0.3)) {
        suggestions.push("- Visiting fewer paid attractions (currently " + 
          Math.round((totals.attractionsTotal / totals.initialBudget) * 100) + "% of budget)");
      }

      if (totals.foodTotal > (totals.initialBudget * 0.2)) {
        suggestions.push("- Eating at more budget-friendly places (currently " + 
          Math.round((totals.foodTotal / totals.initialBudget) * 100) + "% of budget)");
      }
    } else {
      suggestions.push("Your budget allocation looks good!");
      if (totals.budgetHealth === 'warning') {
        suggestions.push("You're getting close to your budget limit. Consider monitoring your spending.");
      }
    }

    return suggestions;
  };

  // Bell ringing loader component
  const BellLoader = () => (
    <div className="bell-loader">
      <div className="bell">
        <div className="bell-body">🔔</div>
        <div className="bell-clapper"></div>
      </div>
      <br />
      
      <p>Loading your budget details...</p>
    </div>
  );

  if (isLoading) return <BellLoader />;
  if (!username) return null;

  return (
    <>
      <Navbar />
      <div className="budget-container">
      <h1
  style={{
    fontFamily: "'Merriweather', serif",
    color: "#b22222",  // dark professional red
    textAlign: "center",
    fontSize: "2.5rem",
    letterSpacing: "2px",
    animation: "fadePulse 2.5s infinite ease-in-out"
  }}
>
  Budget Alert!
</h1>

<style>
{`
  @keyframes fadePulse {
    0%   { opacity: 0.8; transform: scale(1); }
    50%  { opacity: 1;   transform: scale(1.05); }
    100% { opacity: 0.8; transform: scale(1); }
  }
`}
</style>

        
        <div className="budget-summary">
          <div className={`budget-health ${getBudgetHealthClass()}`}>
            <h2>Budget Status</h2>
            <p><strong>Initial Budget:</strong> ₹{totals.initialBudget.toLocaleString()}</p>
            <p><strong>Total Estimated Costs:</strong> ₹{totals.totalSpent.toLocaleString()}</p>
            <p>
              <strong>Remaining:</strong> 
              <span className={getBudgetHealthClass()}>
                ₹{Math.abs(totals.remainingBudget).toLocaleString()} 
                {totals.remainingBudget < 0 ? ' (Over Budget)' : ' (Remaining)'}
              </span>
            </p>
            <div className="cost-breakdown">
              <p><strong>Accommodation:</strong> ₹{totals.accommodationTotal.toLocaleString()}</p>
              <p><strong>Attractions:</strong> ₹{totals.attractionsTotal.toLocaleString()}</p>
              <p><strong>Food:</strong> ₹{totals.foodTotal.toLocaleString()}</p>
              <p><strong>Transport:</strong> ₹{totals.transportTotal.toLocaleString()}</p>
              {Object.entries(additionalCosts.miscellaneous)
                .filter(([_, value]) => value !== '')
                .map(([key, value]) => (
                  <p key={key}>
                    <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> 
                    ₹{Number(value).toLocaleString()}
                  </p>
                ))}
            </div>
          </div>

          <div className="budget-visualization">
            <h2>Cost Breakdown</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="budget-form">
  <h2>Additional Expenses</h2>
  
  {/* Food Section */}
  <div className="form-group">
    <label>Food Budget (per day)</label>
    <input
      type="number"
      name="food"
      value={additionalCosts.food}
      onChange={handleInputChange}
      min="0"
      required
      placeholder="Enter amount"
      className={formErrors.food ? 'error' : ''}
    />
    {formErrors.food && <span className="error-message">{formErrors.food}</span>}
    <div className="preference-options">
      <label>
        <input
          type="radio"
          name="foodPreference"
          checked={foodPreference === 'budget'}
          onChange={() =>
            handlePreferenceChange('food', 'budget', {
              budget: 300,
              'mid-range': 750,
              luxury: 1500,
            })
          }
        />
        Budget Eats (₹200-500/day)
      </label>
      <label>
        <input
          type="radio"
          name="foodPreference"
          checked={foodPreference === 'mid-range'}
          onChange={() =>
            handlePreferenceChange('food', 'mid-range', {
              budget: 300,
              'mid-range': 750,
              luxury: 1500,
            })
          }
        />
        Mid-Range (₹500-1000/day)
      </label>
      <label>
        <input
          type="radio"
          name="foodPreference"
          checked={foodPreference === 'luxury'}
          onChange={() =>
            handlePreferenceChange('food', 'luxury', {
              budget: 300,
              'mid-range': 750,
              luxury: 1500,
            })
          }
        />
        Luxury (₹1000+/day)
      </label>
    </div>
  </div>

  {/* Transport Section */}
  <div className="form-group">
    <label>Transport Budget (per day)</label>
    <input
      type="number"
      name="transport"
      value={additionalCosts.transport}
      onChange={handleInputChange}
      min="0"
      required
      placeholder="Enter amount"
      className={formErrors.transport ? 'error' : ''}
    />
    {formErrors.transport && <span className="error-message">{formErrors.transport}</span>}
    <div className="preference-options">
      <label>
        <input
          type="radio"
          name="transportType"
          checked={transportType === 'public'}
          onChange={() =>
            handlePreferenceChange('transport', 'public', {
              public: 100,
              rental: 800,
              taxis: 500,
              luxury: 2000,
            })
          }
        />
        Public Transport (₹50-200/day)
      </label>
      <label>
        <input
          type="radio"
          name="transportType"
          checked={transportType === 'rental'}
          onChange={() =>
            handlePreferenceChange('transport', 'rental', {
              public: 100,
              rental: 800,
              taxis: 500,
              luxury: 2000,
            })
          }
        />
        Rental Vehicle (₹500-1500/day)
      </label>
      <label>
        <input
          type="radio"
          name="transportType"
          checked={transportType === 'taxis'}
          onChange={() =>
            handlePreferenceChange('transport', 'taxis', {
              public: 100,
              rental: 800,
              taxis: 500,
              luxury: 2000,
            })
          }
        />
        Taxis (₹300-1000/day)
      </label>
      <label>
        <input
          type="radio"
          name="transportType"
          checked={transportType === 'luxury'}
          onChange={() =>
            handlePreferenceChange('transport', 'luxury', {
              public: 100,
              rental: 800,
              taxis: 500,
              luxury: 2000,
            })
          }
        />
        Luxury Transport (₹1500+/day)
      </label>
    </div>
  </div>

  {/* Miscellaneous Section */}
  <div className="form-group">
    <div className="misc-header">
      <label>Miscellaneous Expenses</label>
      <button
        type="button"
        className="toggle-misc-btn"
        onClick={() => setShowMiscOptions(!showMiscOptions)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'transparent',
          border: 'none',
          color: '#007bff',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        {showMiscOptions ? 'Hide Options' : 'Show Options'}
        <span
          style={{
            display: 'inline-block',
            animation: 'bounceArrow 1s infinite',
          }}
        >
          ➔
        </span>
      </button>
    </div>

    {showMiscOptions && (
      <div className="misc-options">
        <div className="misc-option">
          <label>Shopping</label>
          <input
            type="number"
            name="shopping"
            value={additionalCosts.miscellaneous.shopping}
            onChange={handleMiscChange}
            min="0"
            placeholder="Enter amount"
          />
        </div>
        <div className="misc-option">
          <label>Clubbing/Nightlife</label>
          <input
            type="number"
            name="clubbing"
            value={additionalCosts.miscellaneous.clubbing}
            onChange={handleMiscChange}
            min="0"
            placeholder="Enter amount"
          />
        </div>
        <div className="misc-option">
          <label>Souvenirs</label>
          <input
            type="number"
            name="souvenirs"
            value={additionalCosts.miscellaneous.souvenirs}
            onChange={handleMiscChange}
            min="0"
            placeholder="Enter amount"
          />
        </div>
        <div className="misc-option">
          <label>Emergencies</label>
          <input
            type="number"
            name="emergencies"
            value={additionalCosts.miscellaneous.emergencies}
            onChange={handleMiscChange}
            min="0"
            placeholder="Enter amount"
          />
        </div>
        <div className="misc-option">
          <label>Other Expenses</label>
          <input
            type="number"
            name="others"
            value={additionalCosts.miscellaneous.others}
            onChange={handleMiscChange}
            min="0"
            placeholder="Enter amount"
          />
        </div>
      </div>
    )}
  </div>

  {/* Actions */}
  <div className="form-actions">
    <button
      type="button"
      onClick={() => navigate('/dashboard')}
      className="back-btn"
    >
      Back to Dashboard
    </button>
    <button
      type="submit"
      className="save-btn"
      disabled={
        isSubmitting || !additionalCosts.food || !additionalCosts.transport
      }
    >
      {isSubmitting ? 'Saving...' : 'Save Budget Plan'}
    </button>
  </div>

  {/* Inline animation keyframes */}
  <style>
    {`
      @keyframes bounceArrow {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(5px); }
      }
    `}
  </style>
</form>

      </div>

     {/* Budget Summary Modal */}
<Modal
  isOpen={showModal}
  onRequestClose={() => setShowModal(false)}
  className="budget-modal"
  overlayClassName="modal-overlay"
>
  <div className="modal-content">
    <h2>Budget Summary</h2>
    <div className="modal-summary">
      <p><strong>Initial Budget:</strong> ₹{totals.initialBudget.toLocaleString()}</p>
      <p><strong>Total Estimated Costs:</strong> ₹{totals.totalSpent.toLocaleString()}</p>
      <p className={getBudgetHealthClass()}>
        <strong>Remaining:</strong> ₹{Math.abs(totals.remainingBudget).toLocaleString()}
        {totals.remainingBudget < 0 ? ' (Over Budget)' : ' (Remaining)'}
      </p>
    </div>
    
    <div className="modal-suggestions">
      <h3>Suggestions</h3>
      <ul>
        {getSuggestions().map((suggestion, index) => (
          <li key={index}>{suggestion}</li>
        ))}
      </ul>
    </div>
    
    {showThankYou && (
  <div
    style={{
      backgroundColor: "#fff3e6",
      border: "2px solid #ff9900",
      borderRadius: "12px",
      padding: "15px 20px",
      marginTop: "15px",
      textAlign: "center",
      animation: "pulseBox 2s infinite ease-in-out",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    }}
  >
    <p
      style={{
        fontSize: "18px",
        fontWeight: "bold",
        color: "#cc6600",
        marginBottom: "8px",
        animation: "fadeText 2s infinite alternate ease-in-out",
      }}
    >
      🙏 Thank you for choosing us as your trip planner!
    </p>
    <p
      style={{
        fontSize: "16px",
        color: "#804000",
        margin: "0",
        animation: "fadeText 3s infinite alternate ease-in-out",
      }}
    >
      If you’d like to share your experience or suggestions, please leave us your feedback.
    </p>
  </div>
)}

<style>
{`
  @keyframes pulseBox {
    0% { transform: scale(1); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    50% { transform: scale(1.02); box-shadow: 0 6px 18px rgba(255,153,0,0.4); }
    100% { transform: scale(1); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  }

  @keyframes fadeText {
    0% { opacity: 0.7; }
    100% { opacity: 1; }
  }
`}
</style>

    
    <div className="modal-actions">
      <button
        onClick={() => {
          setShowThankYou(true); // Show thank-you text
          setTimeout(() => {
            setShowModal(false); // Close modal
            navigate("/contact"); // Redirect
          }, 4000); // 4 seconds delay before redirect
        }}
        className="modal-ok-btn"
      >
        OK
      </button>
    </div>
  </div>
</Modal>

      <BackToTop />
      <FooterSection />
    </>
  );
};

export default Budget;