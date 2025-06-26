// import React from 'react'
import '../ComponentStyles/NavbarCSS.css';
import { PiCardsFill } from "react-icons/pi";
import { IoFileTrayFull } from "react-icons/io5";
import { MdAccountCircle } from "react-icons/md";
import { useNavigate, useLocation } from 'react-router-dom';
import { FaMarker } from "react-icons/fa";

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const activeColor = "#3ecf8e";
    

  return (
    <>
    <div className="navbar">
        <div className="main" onClick={() => navigate('/')}>
            <PiCardsFill
              size={27}
              color={location.pathname === "/" ? activeColor : undefined}
            />
        </div>
        
        <div className="LeadListsContainer" onClick={() => navigate('/lead-lists-container')}>
            <IoFileTrayFull
              size={25}
              color={location.pathname === "/lead-lists-container" ? activeColor : undefined}
            />
        </div>

        <div className="account" onClick={() => navigate('/account')}>
            <MdAccountCircle
              size={25}
              color={location.pathname === "/account" ? activeColor : undefined}
            />
        </div>


    </div>
    </>
  )
}

export default Navbar