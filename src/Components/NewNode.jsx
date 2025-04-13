import { useState, useEffect } from "react";
import { uploadDataToS3 } from "../awsConfig";
import { v4 as uuidv4 } from "uuid";
import "./NewNode.css";

// Update the validateNode function at the top
const validateNode = (node) => {
  // Basic validation
  if (!node || typeof node !== 'object') {
    throw new Error('Invalid node data');
  }

  // Ensure text is present
  if (!node.text) {
    throw new Error('Node text is required');
  }

  return {
    id: String(node.id || uuidv4()),
    text: String(node.text).trim(),
    type: String(node.type || 'info').toLowerCase(),
    yes: node.type === 'yesno' && node.yes ? String(node.yes).trim() : null,
    no: node.type === 'yesno' && node.no ? String(node.no).trim() : null,
    next: node.type === 'info' && node.next ? String(node.next).trim() : null,
    subheading: node.subheading ? String(node.subheading).trim() : null
  };
};

export default function NewNode({ questions, setQuestions }) {
  const [newQuestion, setNewQuestion] = useState({
    text: "",
    type: "yesno",
    yes: "",
    no: "",
    next: "",
    subheading: "",
  });
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [message, setMessage] = useState("");
  const [customInputs, setCustomInputs] = useState({
    yes: false,
    no: false,
    next: false,
  });

  useEffect(() => {
    if (selectedQuestion) {
      const nodeToEdit = questions.find((q) => q.id === selectedQuestion);
      if (nodeToEdit) {
        setNewQuestion({
          text: nodeToEdit.text,
          type: nodeToEdit.type,
          yes: nodeToEdit.yes || "",
          no: nodeToEdit.no || "",
          next: nodeToEdit.next || "",
          subheading: nodeToEdit.subheading || "",
        });
      }
    } else {
      resetForm();
    }
  }, [selectedQuestion, questions]);

  const resetForm = () => {
    setNewQuestion({
      text: "",
      type: "yesno",
      yes: "",
      no: "",
      next: "",
      subheading: "",
    });
    setCustomInputs({
      yes: false,
      no: false,
      next: false,
    });
  };

  const handleChange = (e) => {
    setNewQuestion({ ...newQuestion, [e.target.name]: e.target.value });
  };

  const handleCustomInputChange = (field, value) => {
    setNewQuestion((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Update the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!newQuestion.text.trim()) {
        throw new Error('Question text is required');
      }

      // Get current flowchart data
      const response = await fetch('flowchart.json');
      let currentFlowchart = await response.json();

      let updatedNodes;
      const currentTime = new Date().toISOString();

      if (selectedQuestion) {
        // Update existing node
        updatedNodes = currentFlowchart.nodes.map(q => 
          q.id === selectedQuestion 
            ? validateNode({
                ...q,
                text: newQuestion.text.trim(),
                type: newQuestion.type,
                yes: newQuestion.type === 'yesno' ? newQuestion.yes.trim() : null,
                no: newQuestion.type === 'yesno' ? newQuestion.no.trim() : null,
                next: newQuestion.type === 'info' ? newQuestion.next.trim() : null,
                subheading: newQuestion.subheading ? newQuestion.subheading.trim() : null
              })
            : q
        );
      } else {
        // Add new node
        const newNode = validateNode({
          id: uuidv4(),
          text: newQuestion.text.trim(),
          type: newQuestion.type,
          yes: newQuestion.type === 'yesno' ? newQuestion.yes.trim() : null,
          no: newQuestion.type === 'yesno' ? newQuestion.no.trim() : null,
          next: newQuestion.type === 'info' ? newQuestion.next.trim() : null,
          subheading: newQuestion.subheading ? newQuestion.subheading.trim() : null
        });

        updatedNodes = [...currentFlowchart.nodes, newNode];
      }

      // Update the flowchart data
      const updatedFlowchart = {
        ...currentFlowchart,
        nodes: updatedNodes,
        lastModified: currentTime
      };

      // Upload the updated data (this should modify the existing file)
      await uploadDataToS3({
        key: 'flowchart.json',
        data: updatedFlowchart,
        update: true  // flag to indicate this is an update
      });

      // Update local state
      setQuestions(updatedNodes);
      setMessage(selectedQuestion ? "Node updated successfully!" : "New node added successfully!");
      resetForm();
      setSelectedQuestion("");
      
      setTimeout(() => setMessage(""), 3000);

    } catch (error) {
      console.error("Operation failed:", error);
      setMessage(`Error: ${error.message}`);
    }
  };

  // Update the handleDelete function
  const handleDelete = async () => {
    try {
      if (!selectedQuestion) {
        throw new Error("No node selected to delete");
      }

      const isConfirmed = window.confirm("Are you sure you want to delete this node?");
      if (!isConfirmed) return;

      // Get current flowchart data
      const response = await fetch('flowchart.json');
      let currentFlowchart = await response.json();

      // Update nodes array
      const updatedNodes = currentFlowchart.nodes
        .filter(q => q.id !== selectedQuestion)
        .map(q => validateNode(q));

      // Update the flowchart data
      const updatedFlowchart = {
        ...currentFlowchart,
        nodes: updatedNodes,
        lastModified: new Date().toISOString()
      };

      // Upload the updated data (this should modify the existing file)
      await uploadDataToS3({
        key: 'flowchart.json',
        data: updatedFlowchart,
        update: true  // flag to indicate this is an update
      });

      // Update local state
      setQuestions(updatedNodes);
      setMessage("Node deleted successfully!");
      resetForm();
      setSelectedQuestion("");
      
      setTimeout(() => setMessage(""), 3000);

    } catch (error) {
      console.error("Delete operation failed:", error);
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="new-node-container">
      <h2 style={{ color: "#0d6efd" }}>
        {selectedQuestion ? "Edit Existing Node" : "Add New Node"}
      </h2>

      <label>Select Existing Node (Optional):</label>
      <select
        value={selectedQuestion}
        onChange={(e) => setSelectedQuestion(e.target.value)}
      >
        <option value="">Select a question...</option>
        {questions.map((q) => (
          <option
            key={q.id}
            value={q.id}
            disabled={selectedQuestion && q.id === selectedQuestion}
          >
            {q.text}
          </option>
        ))}
      </select>

      <form onSubmit={handleSubmit}>
        <label>Question Text:</label>
        <input
          type="text"
          name="text"
          value={newQuestion.text}
          onChange={handleChange}
          required
        />

        <label>Subheading (Optional):</label>
        <input
          type="text"
          name="subheading"
          value={newQuestion.subheading}
          onChange={handleChange}
          placeholder="Enter subheading text"
        />

        <label>Type:</label>
        <select name="type" value={newQuestion.type} onChange={handleChange}>
          <option value="yesno">Yes/No</option>
          <option value="info">Info</option>
        </select>

        {newQuestion.type === "yesno" && (
          <>
            <label>Yes (Next Question):</label>
            <div className="connection-field">
              <select
                name="yes"
                value={customInputs.yes ? "other" : newQuestion.yes || ""}
                onChange={(e) => {
                  if (e.target.value === "other") {
                    setCustomInputs((prev) => ({ ...prev, yes: true }));
                  } else {
                    setCustomInputs((prev) => ({ ...prev, yes: false }));
                    handleChange(e);
                  }
                }}
              >
                <option value="">Select a question...</option>
                {questions.map((q) => (
                  <option
                    key={q.id}
                    value={q.id}
                    disabled={selectedQuestion && q.id === selectedQuestion}
                  >
                    {q.text}
                  </option>
                ))}
                <option value="other">Other (Enter custom text)</option>
              </select>

              {customInputs.yes && (
                <input
                  type="text"
                  className="custom-input"
                  placeholder="Enter custom text"
                  value={newQuestion.yes || ""}
                  onChange={(e) => handleCustomInputChange("yes", e.target.value)}
                />
              )}
            </div>

            <label>No (Next Question):</label>
            <div className="connection-field">
              <select
                name="no"
                value={customInputs.no ? "other" : newQuestion.no || ""}
                onChange={(e) => {
                  if (e.target.value === "other") {
                    setCustomInputs((prev) => ({ ...prev, no: true }));
                  } else {
                    setCustomInputs((prev) => ({ ...prev, no: false }));
                    handleChange(e);
                  }
                }}
              >
                <option value="">Select a question...</option>
                {questions.map((q) => (
                  <option
                    key={q.id}
                    value={q.id}
                    disabled={selectedQuestion && q.id === selectedQuestion}
                  >
                    {q.text}
                  </option>
                ))}
                <option value="other">Other (Enter custom text)</option>
              </select>

              {customInputs.no && (
                <input
                  type="text"
                  className="custom-input"
                  placeholder="Enter custom text"
                  value={newQuestion.no || ""}
                  onChange={(e) => handleCustomInputChange("no", e.target.value)}
                />
              )}
            </div>
          </>
        )}

        {newQuestion.type === "info" && (
          <>
            <label>Next (Next Question):</label>
            <div className="connection-field">
              <select
                name="next"
                value={customInputs.next ? "other" : newQuestion.next || ""}
                onChange={(e) => {
                  if (e.target.value === "other") {
                    setCustomInputs((prev) => ({ ...prev, next: true }));
                  } else {
                    setCustomInputs((prev) => ({ ...prev, next: false }));
                    handleChange(e);
                  }
                }}
              >
                <option value="">Select a question...</option>
                {questions.map((q) => (
                  <option
                    key={q.id}
                    value={q.id}
                    disabled={selectedQuestion && q.id === selectedQuestion}
                  >
                    {q.text}
                  </option>
                ))}
                <option value="other">Other (Enter custom text)</option>
              </select>

              {customInputs.next && (
                <input
                  type="text"
                  className="custom-input"
                  placeholder="Enter custom text"
                  value={newQuestion.next || ""}
                  onChange={(e) => handleCustomInputChange("next", e.target.value)}
                />
              )}
            </div>
          </>
        )}

        <button type="submit">
          {selectedQuestion ? "Update Node" : "Add Node"}
        </button>

        {selectedQuestion && (
          <button
            type="button"
            onClick={handleDelete}
            className="delete-button"
          >
            Delete Node
          </button>
        )}
      </form>

      {message && <p className="success-message">{message}</p>}
    </div>
  );
}