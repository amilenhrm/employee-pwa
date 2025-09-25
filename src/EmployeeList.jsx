import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { List, ListItem, ListItemText } from "@mui/material";

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "employees"), (snapshot) => {
      setEmployees(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <List>
      {employees.map((emp) => (
        <ListItem key={emp.id}>
          <ListItemText primary={emp.name} secondary={emp.position} />
        </ListItem>
      ))}
    </List>
  );
};

export default EmployeeList;
