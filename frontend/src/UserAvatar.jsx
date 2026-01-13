import React from 'react';
import PersonIcon from '@mui/icons-material/Person';

const UserAvatar = ({ username = 'User', size = 'medium' }) => {
    const dims = {
        small: { w: 32, h: 32, fontSize: '0.8rem' },
        medium: { w: 40, h: 40, fontSize: '1rem' },
        large: { w: 56, h: 56, fontSize: '1.25rem' }
    };

    const { w, h, fontSize } = dims[size];

    return (
        <div style={{
            width: w,
            height: h,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: fontSize,
            border: '2px solid var(--bg-app)',
            boxShadow: '0 0 0 2px var(--border-subtle)',
            userSelect: 'none'
        }}>
            {username.charAt(0).toUpperCase()}
        </div>
    );
};

export default UserAvatar;
