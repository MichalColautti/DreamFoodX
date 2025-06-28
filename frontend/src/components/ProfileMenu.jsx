import React, { useState, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../AuthContext';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Stack from '@mui/material/Stack';

function ProfileMenu() {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return;
        }
        setOpen(false);
    };

    const handleLogout = () => {
        logout();
        setOpen(false);
        navigate("/");
    };

    return (
        <Stack direction="row" spacing={2}>
            <div>
                <button
                    ref={anchorRef}
                    onClick={handleToggle}
                    className="btn btn-link p-2"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ width: "1.2em", height: "1.2em" }}
                    >
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </button>
                <Popper
                    open={open}
                    anchorEl={anchorRef.current}
                    role={undefined}
                    placement="bottom-start"
                    transition
                    disablePortal
                >
                    {({ TransitionProps, placement }) => (
                        <Grow
                            {...TransitionProps}
                            style={{
                                transformOrigin:
                                    placement === 'bottom-start' ? 'left top' : 'left bottom',
                            }}
                        >
                            <Paper>
                                <ClickAwayListener onClickAway={handleClose}>
                                    <MenuList
                                        autoFocusItem={open}
                                        id="composition-menu"
                                        aria-labelledby="composition-button"
                                    >
                                        {user !== null ? (
                                            <>
                                                <MenuItem onClick={handleClose}>
                                                    <Link to="/profile" className="nav-link">
                                                        Profil
                                                    </Link>
                                                </MenuItem>
                                                <MenuItem onClick={handleLogout}>
                                                    Wyloguj się
                                                </MenuItem>
                                            </>
                                        ) : (
                                            <>
                                                <MenuItem onClick={handleClose}>
                                                    <Link to="/login" className="nav-link">
                                                        Zaloguj się
                                                    </Link>
                                                </MenuItem>
                                                <MenuItem onClick={handleClose}>
                                                    <Link to="/register" className="nav-link">
                                                        Zarejestruj się
                                                    </Link>
                                                </MenuItem>
                                            </>
                                        )}
                                    </MenuList>
                                </ClickAwayListener>
                            </Paper>
                        </Grow>
                    )}
                </Popper>
            </div>
        </Stack>
    );
}

export default ProfileMenu;