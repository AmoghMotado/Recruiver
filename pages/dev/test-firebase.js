import { db } from "../../lib/firebaseClient";
import { collection, addDoc } from "firebase/firestore";
import { useState } from "react";

export default function TestFirebase() {
  const [error, setError] = useState("");

  async function writeTest() {
    setError("");
    try {
      const ref = collection(db, "testCollection");

      await addDoc(ref, {
        timestamp: Date.now(),
        hello: "world",
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Firebase smoke test</h2>
      <button onClick={writeTest} style={{ padding: 12, borderRadius: 6 }}>
        Write test document
      </button>

      {error && (
        <p style={{ marginTop: 20, color: "red" }}>
          ❌ Error: {error}
        </p>
      )}
    </div>
  );
}
