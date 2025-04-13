import { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import NewNode from "./NewNode";
import HistoryModal from "./HistoryModal";
import { fetchDataFromS3 } from "../awsConfig";
import "./App.css";
import TreeList from "./TreeList";
import NewTree from "./NewTree";

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentText, setCurrentText] = useState("Modification to an already cleared / licensed device?");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isEnd, setIsEnd] = useState(false);
  const [hasLoggedEnd, setHasLoggedEnd] = useState(false);
  const [showTree, setShowTree]=useState(false);
  const [selectedFlowchart, setSelectedFlowchart] = useState(null);
  const [currentFlowchart, setCurrentFlowchart] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  const handleFlowchartSelect = (flowchartData) => {
    setSelectedFlowchart(flowchartData);
  };

  // Modified initial load effect
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // First, get the list of all flowcharts
        const response = await fetch('YOUR_S3_LIST_ENDPOINT');
        const flowchartsList = await response.json();

        // Sort by creation time and get the first (oldest) flowchart
        const sortedFlowcharts = flowchartsList.sort((a, b) => {
          const timeA = parseInt(a.filename.split('-').pop().replace('.json', ''));
          const timeB = parseInt(b.filename.split('-').pop().replace('.json', ''));
          return timeA - timeB;
        });

        if (sortedFlowcharts.length > 0) {
          // Load the first flowchart's data
          const firstFlowchartData = await fetchDataFromS3(sortedFlowcharts[0].filename);
          
          // Set the flowchart data
          setCurrentFlowchart(firstFlowchartData);
          setQuestions(firstFlowchartData.nodes);
          setCurrentQuestion(firstFlowchartData.nodes[0]);
          setCurrentText(firstFlowchartData.nodes[0].text);
          
          // Store in localStorage
          localStorage.setItem('currentFlowchart', JSON.stringify(firstFlowchartData));
        }
      } catch (error) {
        console.error("Error loading initial flowchart:", error);
      }
    };

    loadInitialData();
  }, []); // Empty dependency array for initial load only

  useEffect(() => {
    // Load flowchart data from location state or localStorage
    const flowchartData = location.state?.flowchartData || JSON.parse(localStorage.getItem('currentFlowchart'));
    if (flowchartData) {
      setCurrentFlowchart(flowchartData);
      // Initialize question view with first node
      const firstNode = flowchartData.nodes[0];
      setCurrentQuestion(firstNode);
      setQuestions(flowchartData.nodes);
      setCurrentText(firstNode.text);
    }
  }, [location]);

  console.log("Current Question:", currentQuestion);

  useEffect(() => {
    if (currentQuestion && currentQuestion.type !== "yesno" && !currentQuestion.next) {
      setIsEnd(true);
      if (!hasLoggedEnd) {
        setHistory((prevHistory) => [
          ...prevHistory,
          { id: currentQuestion.id, question: currentQuestion.text, answer: "End" },
        ]);
        setHasLoggedEnd(true);
      }
    } else {
      setIsEnd(false);
      setHasLoggedEnd(false);
    }
  }, [currentQuestion, hasLoggedEnd]);

  // Handle Answer Click
  const handleAnswer = (answer) => {
    setHistory([...history, { id: currentQuestion.id, question: currentQuestion.text, answer }]);
    const nextText = currentQuestion[answer];
    if (nextText) {
      const nextQuestion = questions.find(q => q.text === nextText);
      setCurrentQuestion(nextQuestion);
      setCurrentText(nextText);
    } else {
      setIsEnd(true);
    }
  };

  // Handle Next Button
  const handleNext = () => {
    if (currentQuestion.next) {
      setHistory([...history, { id: currentQuestion.id, question: currentQuestion.text, answer: "Next" }]);
      const nextQuestion = questions.find(q => q.text === currentQuestion.next);
      setCurrentQuestion(nextQuestion);
      setCurrentText(currentQuestion.next);
    } else {
      setIsEnd(true);
    }
  };

  // Handle Back Button
  const handleBack = () => {
    if (history.length === 0) return;

    const newHistory = [...history];
    if (isEnd && newHistory[newHistory.length - 1]?.answer === "End") {
      newHistory.pop();
    }

    if (newHistory.length === 0) {
      setHistory(newHistory);
      const firstQuestion = questions[0];
      setCurrentQuestion(firstQuestion);
      setCurrentText(firstQuestion.text);
      setIsEnd(false);
      return;
    }

    const previousEntry = newHistory.pop();
    const previousQuestion = questions.find(q => q.text === previousEntry.question);
    setHistory(newHistory);
    setCurrentQuestion(previousQuestion);
    setCurrentText(previousEntry.question);
    setIsEnd(false);
  };

  // Handle Restart Button
  const handleRestart = () => {
    const firstQuestion = questions[0];
    setCurrentQuestion(firstQuestion);
    setCurrentText(firstQuestion?.text || "Modification to an already cleared / licensed device?");
    setHistory([]);
    setIsEnd(false);
    setHasLoggedEnd(false);
  };

  const isTreeListRoute = location.pathname === '/TreeList';

  return (
    <div className="app">
      {!isTreeListRoute && <Sidebar onFlowchartSelect={handleFlowchartSelect} />}
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <header className="header">
                <h1 className="header-title">
                  {currentFlowchart ? currentFlowchart.name : "LTF / 510k Submission Decision Process"}
                </h1>
                <div className="header-buttons">
                  <button onClick={handleRestart}>Restart</button>
                  <button onClick={() => setShowHistory(true)}>History</button>
                  <button 
                    onClick={() => {
                      const flowchartData = {
                        name: currentFlowchart?.name || "LTF / 510k Submission Decision Process",
                        nodes: questions
                      };
                      localStorage.setItem('currentFlowchart', JSON.stringify(flowchartData));
                      navigate('/TreeList', { state: { flowchartData } });
                    }}
                    className="view-flowchart-btn"
                  >
                    View Flowchart
                  </button>
                </div>
              </header>

              <div className="app-container">
                {currentQuestion?.subheading && <h2>{currentQuestion.subheading}</h2>}
                {currentQuestion && <p>{currentQuestion.text}</p>}
                {isEnd && <p>End of the flowchart!</p>}

                <div className="button-group">
                {!isEnd && currentQuestion && currentQuestion.type === "yesno" && (
                  <>
                    <button className="yes" onClick={() => handleAnswer("yes")}>
                      Yes
                    </button>
                    <button className="no" onClick={() => handleAnswer("no")}>
                      No
                    </button>
                  </>
                )}  
                {!isEnd && currentQuestion && currentQuestion.type === "info" && currentQuestion.next && (
                    <button className="next" onClick={handleNext}>
                      Next
                    </button>
                  )}

                  {history.length > 0 && (
                    <button className="back" onClick={handleBack}>
                      Back
                    </button>
                  )}
                </div>
              </div>
              
            </div>
          }
        />
        <Route path="/new-node" element={<NewNode questions={questions} setQuestions={setQuestions} />} />
        <Route path="/TreeList" element={<TreeList />} />
        <Route path="/new-tree" element={<NewTree onFlowchartSaved={(filename) => {
          // Refresh sidebar when new flowchart is saved
          document.location.reload();
        }} />} />
      </Routes>
     
      {showHistory && <HistoryModal history={history} onClose={() => setShowHistory(false)} />}
    </div>
  );
};

export default App;
