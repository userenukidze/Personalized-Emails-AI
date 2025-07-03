import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainPage from './Pages/MainPage';
import LoginPage from './Pages/LoginPage';
import SignupPage from './Pages/SignupPage';
import Wrapper from './Pages/Wrapper'; // Adjust the path if needed
import LeadListsContainer from './Pages/LeadListsContainer';
import AccountPage from './Pages/AccountPage';
import LeadList from './Pages/LeadList';
import TestEmailVerification from './Pages/testEmailVerification';
import AddEmails from './Pages/AddEmails';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected route */}
        <Route
          path="/"
          element={
            <Wrapper>
              <MainPage />
            </Wrapper>
          }
        />

        <Route
          path="/lead-lists-container"
          element={
            <Wrapper>
              <LeadListsContainer />
            </Wrapper>
          }
        />

        <Route
          path="/account"
          element={
            <Wrapper>
              <AccountPage />
            </Wrapper>
          }
        />

        <Route
          path="/lead-list"
          element={
            <Wrapper>
              <LeadList />
            </Wrapper>
          }
        />
        <Route
          path="/manage-emails"
          element={
            <Wrapper>
              <AddEmails/>
            </Wrapper>
          }
        />


        
      </Routes>
    </Router>
  )
}

export default App