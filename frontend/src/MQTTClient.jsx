import React, { useState, useEffect } from "react";
import mqtt from "mqtt";
import dataService from "./services/data";

const BoxSimulator = ({ boxInUse, doorIsClosed }) => {
  return (
    <div style={{ border: "5px solid black" }}>
      <h2>BoxSimulator</h2>
      <p>Is in use: {boxInUse.toString()}</p>
      <p>Door is closed: {doorIsClosed.toString()}</p>
    </div>
  );
};

const AppInterface = ({
  boxInUse,
  doorIsClosed,
  setPin,
  pin,
  setBoxInUse,
  setDoorIsClosed,
  topic,
  client,
}) => {
  const [showPin, setShowPin] = useState(false);

  const generatePinCode = () => {
    return Math.floor(1000 + Math.random() * 9000);
  };

  const reserveBox = () => {
    const newPin = generatePinCode();
    setPin(newPin);
    setShowPin(true);
    dataService.updateData({ pinCode: newPin.toString() });
    dataService.updateData({ boxInUse: true });
    if (client) client.publish(topic, "1");
  };

  const openBox = () => {
    event.preventDefault();
    var pinInput = document.getElementById("pinInput");
    var pinAttempt = pinInput.value;
    if (pinAttempt == pin) {
      console.log("Correct pin!");
      setBoxInUse(false);
      dataService.updateData({ boxInUse: false });
      if (client) client.publish(topic, "0");
    } else {
      console.log("Incorrect pin!");
    }
    pinInput.value = "";
  };

  if (!doorIsClosed)
    return (
      <div style={{ border: "5px solid red" }}>Close the box door first.</div>
    );

  if (boxInUse)
    return (
      <div style={{ border: "5px solid red" }}>
        <h2>AppInterface</h2>
        <p>BOX IS CURRENTLY IN USE</p>
        <form onSubmit={openBox}>
          <input type="text" placeholder="PIN code" id="pinInput"></input>
          <button type="submit">Open box</button>
        </form>
      </div>
    );
  else
    return (
      <div style={{ border: "5px solid green" }}>
        <h2>AppInterface</h2>
        {showPin ? (
          <p>Box locked! PIN code for opening the box: {pin}</p>
        ) : (
          <>
            <p>BOX IS FREE!</p>
            <button onClick={reserveBox}>Reserve box</button>
          </>
        )}
      </div>
    );
};

const MQTTClient = () => {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [doorIsClosed, setDoorIsClosed] = useState(false);
  const [boxInUse, setBoxInUse] = useState(false);
  const [data, setData] = useState([]);
  const [pin, setPin] = useState("0000");
  const [lastError, setLastError] = useState("");

  const topic = "laatikko/1";

  const host = "test.mosquitto.org";
  const isSecure = window.location.protocol === "https:";
  const port = isSecure ? 8081 : 8080;
  const protocol = isSecure ? "wss" : "ws";
  const brokerUrl = `${protocol}://${host}:${port}/mqtt`;

  useEffect(() => {
    const mqttClient = mqtt.connect(brokerUrl, {
      connectTimeout: 4000,
      reconnectPeriod: 1000,
      keepalive: 30,
      clientId: "web_" + Math.random().toString(16).substr(2, 8),
    });

    mqttClient.on("connect", () => {
      console.log("Connected to broker", brokerUrl);
      setIsConnected(true);
      mqttClient.subscribe(topic, (err) => {
        if (err) console.error("Subscribe error:", err);
      });
    });

    mqttClient.on("message", (topic, message) => {
      switch (message.toString()) {
        case "close":
          setDoorIsClosed(true);
          console.log("door is closed");
          dataService.updateData({ doorIsClosed: true });
          break;
        case "open":
          setDoorIsClosed(false);
          console.log("door si open");
          dataService.updateData({ doorIsClosed: false });
          break;
      }
      setMessages((prev) => [...prev, `${topic}: ${message.toString()}`]);
    });

    mqttClient.on("error", (err) => {
      console.error("Connection error: ", err);
      setIsConnected(false);
      setLastError(err?.message || err?.toString() || "Unknown error");
    });

    mqttClient.on("reconnect", () => {
      console.log("Attempting to reconnect...");
      setIsConnected(false);
    });

    mqttClient.on("close", () => {
      console.log("Connection closed");
      setIsConnected(false);
    });

    mqttClient.on("offline", () => {
      console.log("Client went offline");
      setIsConnected(false);
    });

    setClient(mqttClient);

    fetchData();

    return () => {
      mqttClient.end();
    };
  }, []);

  const fetchData = async () => {
    dataService.getAll().then((response) => {
      setData(response);
      setDoorIsClosed(response.doorIsClosed);
      setBoxInUse(response.boxInUse);
      setPin(response.pinCode);
    });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (client && input) {
      client.publish(topic, input);
      setInput("");
    }
  };

  return (
    <div>
      {/* <BoxSimulator boxInUse={boxInUse} doorIsClosed={doorIsClosed} /> */}

      <h2>MQTT test</h2>
      <div
        style={{
          background: "#eee",
          padding: "0.5em",
          marginBottom: "1em",
          border: "1px solid #ccc",
        }}
      >
        <strong>Broker URL:</strong> {brokerUrl}
        <br />
        <strong>Status:</strong>{" "}
        {isConnected ? "Connection successful :)" : "Connection failed ;("}
        {lastError && (
          <>
            <br />
            <strong>Last error:</strong>{" "}
            <span style={{ color: "red" }}>{lastError}</span>
          </>
        )}
      </div>
      <h4>MQTT Komennot:</h4>
      <p>"close" = simuloi oven sulkemista</p>
      <p>"open" = simuloi oven avaamista</p>
      <div>
        <form onSubmit={sendMessage}>
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
      <AppInterface
        boxInUse={boxInUse}
        doorIsClosed={doorIsClosed}
        setPin={setPin}
        pin={pin}
        setBoxInUse={setBoxInUse}
        setDoorIsClosed={setDoorIsClosed}
        topic={topic}
        client={client}
      />
    </div>
  );
};

export default MQTTClient;
