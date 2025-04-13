import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { fetchDataFromS3 } from "../awsConfig";

export default function HistoryModal({ history, onClose }) {
  const [fetchedQuestions, setFetchedQuestions] = useState([]);

  useEffect(() => {
    const loadQuestions = async () => {
      const storedQuestions = await fetchDataFromS3();
      setFetchedQuestions(storedQuestions);
    };
    loadQuestions();
  }, []);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const content = history
      .map((item, index) => {
        const questionData = fetchedQuestions.find((q) => q.id === item.id);
        const subheadingText = questionData?.subheading
          ? `Subheading: ${questionData.subheading}\n`
          : "";
        return (
          `Q${index + 1}:\n${subheadingText}${item.question}\nAnswer: ${item.answer.toUpperCase()}`
        );
      })
      .join("\n\n");

    doc.setFontSize(12);
    doc.text(content, 10, 10); // x=10, y=10 padding
    doc.save("LTF / 510k Submission Decision Process Report.pdf");
  };

  return (
    <div className="history-modal">
      <div className="history-content">
        <div className="history-header">
          <h2 className="history-header">
            History
          </h2>
        </div>
        {history.length === 0 ? (
          <p>No history yet.</p>
        ) : (
          <ul className="history-body">
            {history.map((item, index) => {
              const questionData = fetchedQuestions.find((q) => q.id === item.id);
              return (
                <li key={index} className="history-item">
                  {questionData?.subheading && (
                    <h4 className="history-subheading">
                      {questionData.subheading}
                    </h4>
                  )}
                  <strong>Q{index + 1}:</strong> {item.question}
                  <br />
                  <strong>Answer:</strong> {item.answer.toUpperCase()}
                </li>
              );
            })}
          </ul>
        )}

        <div className="button-group">
          <button onClick={handleDownloadPDF} className="download-btn">
            Download PDF
          </button>
          <button onClick={onClose} className="close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
