import React, { useState, useEffect } from "react";

const MQTTDebugger = ({ isConnected, sendMessage, host, port, messages }) => {
  const [input, setInput] = useState(null);
  return (
    <div>
      <h2>MQTT test</h2>
      <p>Host: {host}</p>
      <p>Port: {port}</p>
      <h4>MQTT Komennot:</h4>
      <p>"close" = simuloi oven sulkemista</p>
      <p>"open" = simuloi oven avaamista</p>
      <p>
        Status:{" "}
        {isConnected ? "Connection successful :)" : "Connection failed ;("}
      </p>
      <div>
        <form onSubmit={(e) => sendMessage(e, input, setInput)}>
          <input
            type="text"
            value={input}
            placeholder="Message"
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </div>
      <div>
        <h3>Messages</h3>
        <ul>
          {messages
            .slice()
            .reverse()
            .map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default MQTTDebugger;
