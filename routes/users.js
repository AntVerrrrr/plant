var express = require('express');
var router = express.Router();
var passport = require('passport');
var bcrypt = require('bcryptjs');
var connection = require('../models/db'); // 데이터베이스 연결 설정을 불러옵니다.
const flash = require('connect-flash');
const multer = require('multer'); //이미지 쉽게 저장하는거
const path = require('path');
const session = require('express-session');


// express-flash 미들웨어를 사용하여 플래시 메시지 설정
router.use(flash());

// 세션 미들웨어 설정
router.use(session({
    secret: 'secret key',
    resave: false,
    saveUninitialized: true,
}));

// // 디스크 스토리지 엔진을 사용하여 파일 저장 위치와 이름을 설정
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, path.join(__dirname, '../uploads/profiles')); // 파일이 저장될 서버 상의 경로
//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // 파일명 설정
//     }
// });
// const profiles = multer({ storage: storage });

// Multer 설정: 이미지 저장을 위한 설정
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads', 'profiles')); // 프로필 이미지가 저장될 서버상의 경로
    },
    filename: function(req, file, cb) {
        // 파일명 설정: 현재 시간 + 원본 파일명
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });



// 사용자가 인증되었는지 확인하는 미들웨어
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();  // 사용자가 로그인한 경우 요청을 계속 진행
    }
    res.redirect('/users/login');  // 로그인하지 않은 사용자를 로그인 페이지로 리디렉션
}

// 회원가입 페이지
router.get('/signup', function(req, res) {
    res.render('signup', { message: req.flash('signupMessage') });
});


// 회원가입 처리
router.post('/signup', function(req, res) {
    var { username, email, password } = req.body;
    
    // 입력 값 검증 로직 추가
    if (!email || !password || !username) {
        req.flash('signupMessage', 'All fields are required.');
        return res.redirect('/signup');
    }

    connection.query('SELECT * FROM users WHERE email = ?', [email], function(err, results) {
        if (err) throw err;
        if (results.length) {
            req.flash('signupMessage', 'That email is already taken.');
            return res.redirect('/signup');
        } else {
            bcrypt.hash(password, 10, function(err, hash) {
                if (err) throw err;
                connection.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash], function(err, results) {
                    if (err) throw err;
                    req.login({ id: results.insertId, username, email }, function(err) {
                        if (err) throw err;
                        return res.redirect('/'); // 사용자를 메인 페이지로 리다이렉트
                    });
                });
            });
        }
    });
});


// 로그인 페이지
router.get('/login', (req, res) => {
    res.render('login', { message: req.flash('loginMessage') });
});


// 로그인 처리
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('loginMessage', info.message);
            return res.redirect('/users/login');
        }
        req.logIn(user, function(err) {
            if (err) {
                return next(err);
            }
            return res.redirect('/'); // 로그인 성공 시 리다이렉트
        });
    })(req, res, next);
});


// 로그아웃 라우트
router.get('/logout', function(req, res) {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.flash('loginMessage', 'You have been logged out.');
        res.redirect('/'); // 로그아웃 후 로그인 페이지로 리다이렉트
    });
});


router.get('/mypage', isAuthenticated, function(req, res) {
    const userId = req.user.id; // 로그인한 사용자의 ID

    // 사용자 정보 조회
    connection.query('SELECT * FROM users WHERE id = ?', [userId], function(err, userResults) {
        if (err) {
            console.error("Error fetching user info: ", err);
            return res.status(500).send("Internal Server Error");
        }
        if (userResults.length > 0) {
            const user = userResults[0];

            // 팔로워 수 조회
            connection.query('SELECT COUNT(*) AS followerCount FROM follows WHERE following_id = ?', [userId], function(err, followCountResults) {
                if (err) {
                    console.error("Error fetching follow count: ", err);
                    return res.status(500).send("Internal Server Error");
                }
                
                const followerCount = followCountResults[0].followerCount;

                // 사용자가 작성한 글 조회
                const query = `
                    SELECT * 
                    FROM posts 
                    WHERE author_id = ? 
                    ORDER BY created_at DESC`;

                connection.query(query, [userId], function(err, postsResults) {
                    if (err) {
                        console.error("Error fetching user posts: ", err);
                        return res.status(500).send("Internal Server Error");
                    }
                    
                    // 마이페이지 렌더링, 모든 필요 데이터 전달
                    res.render('users/mypage', { 
                        user: user, 
                        posts: postsResults,
                        followerCount: followerCount  // 팔로워 수도 전달
                    });
                });
            });
        } else {
            res.status(404).send('User not found');
        }
    });
});

// 사용자 프로필 페이지
router.get('/profile/:id', isAuthenticated, (req, res) => {
    const userId = req.params.id;

    connection.query('SELECT * FROM users WHERE id = ?', [userId], function(err, userProfileResults) {
        if (err) {
            console.error("Error fetching user: ", err);
            return res.status(500).send("Internal Server Error");
        }
        if (userProfileResults.length > 0) {
            const userProfile = userProfileResults[0];

            // 팔로워 수 조회
            connection.query('SELECT COUNT(*) AS followerCount FROM follows WHERE following_id = ?', [userId], function(err, followCountResults) {
                if (err) {
                    console.error("Error fetching follow count: ", err);
                    return res.status(500).send("Internal Server Error");
                }
                
                const followerCount = followCountResults[0].followerCount;

                // 사용자가 작성한 레시피 가져오기 (최근에 작성된 순서대로)
                const query = `
                    SELECT * 
                    FROM posts 
                    WHERE author_id = ? 
                    ORDER BY created_at DESC`;

                connection.query(query, [userId], function(err, userpostsResults) {
                    if (err) {
                        console.error("Error fetching user posts: ", err);
                        return res.status(500).send("Internal Server Error");
                    }
                    
                    // 로그인한 사용자가 이 프로필을 팔로우하고 있는지 확인
                    const currentUserId = req.user.id;
                    connection.query('SELECT * FROM follows WHERE follower_id = ? AND following_id = ?', [currentUserId, userId], function(err, followResults) {
                        if (err) {
                            console.error("Error checking follow status: ", err);
                            return res.status(500).send("Internal Server Error");
                        }
                        const isFollowing = followResults.length > 0;
                        res.render('users/profile', { user: userProfile, currentUser: req.user, isFollowing: isFollowing, followerCount: followerCount, posts: userpostsResults });
                    });
                });
            });
        } else {
            res.status(404).send('User not found');
        }
    });
});




const profileUpload = multer({ storage: storage });

// 팔로우 처리
router.post('/follow/:id', function(req, res) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const followerId = req.user.id;
    const followingId = req.params.id;

    connection.query('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [followerId, followingId], function(err) {
        if (err) {
            console.error("Error adding follow: ", err);
            return res.status(500).json({ success: false, message: 'Error following user' });
        }
        res.json({ success: true, message: 'Followed successfully' });
    });
});

// 언팔로우 처리
router.post('/unfollow/:id', function(req, res) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const followerId = req.user.id;
    const followingId = req.params.id;

    connection.query('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [followerId, followingId], function(err) {
        if (err) {
            console.error("Error removing follow: ", err);
            return res.status(500).json({ success: false, message: 'Error unfollowing user' });
        }
        res.json({ success: true, message: 'Unfollowed successfully' });
    });
});











// GET 요청: 비밀번호 확인 페이지
router.get('/confirm-password', isAuthenticated, (req, res) => {
    res.render('users/confirm-password');
});

// 비밀번호 확인 라우트
router.post('/confirm-password', isAuthenticated, (req, res) => {
    const { password } = req.body;
    const userId = req.user.id;
    connection.query('SELECT password FROM users WHERE id = ?', [userId], async (err, results) => {
        if (err) {
            return res.status(500).send("Internal Server Error");
        }
        const match = await bcrypt.compare(password, results[0].password);
        if (match) {
            res.redirect('/users/edit-profile');
        } else {
            req.flash('error', 'Incorrect password');
            res.redirect('/users/confirm-password');
        }
    });
});

// 프로필 수정 라우트
router.get('/edit-profile', isAuthenticated, (req, res) => {
    res.render('users/edit-profile', { user: req.user });
});

// 프로필 수정 처리 라우트
// router.post('/edit-profile', isAuthenticated, (req, res) => {
//     const { username, email } = req.body;
//     const userId = req.user.id;
//     connection.query('UPDATE users SET username = ?, email = ? WHERE id = ?', [username, email, userId], (err, results) => {
//         if (err) {
//             return res.status(500).send("Internal Server Error");
//         }
//         req.flash('success', 'Profile updated successfully!');
//         res.redirect('/users/mypage');  // Assume there's a route for user's profile page
//     });
// });

router.post('/edit-profile', isAuthenticated, upload.single('profileImage'), async (req, res) => {
    const { username, email, password } = req.body;
    const userId = req.user.id;
    let profileFileName = req.file ? req.file.filename : null; // 파일명만 가져오기

    let hashedPassword = null;

    if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
    }

    let query = 'UPDATE users SET username = ?, email = ?';
    let params = [username, email];

    if (hashedPassword) {
        query += ', password = ?';
        params.push(hashedPassword);
    }

    if (profileFileName) {
        query += ', profile_image = ?'; // 프로필 이미지 파일명만 저장
        params.push(profileFileName);
    }

    query += ' WHERE id = ?';
    params.push(userId);

    connection.query(query, params, (err, results) => {
        if (err) {
            console.error("Error updating user: ", err);
            return res.status(500).send("Internal Server Error");
        }
        req.flash('success', 'Profile updated successfully!');
        res.redirect('/users/mypage');
    });
});

module.exports = router;

