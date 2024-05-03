const express = require('express');
const router = express.Router();
const connection = require('../models/db'); // 데이터베이스 연결 설정
const multer = require('multer'); //이미지 업로드
const path = require('path'); //이미지 업로드
const post = require('../models/post');

// 사용자가 인증되었는지 확인하는 미들웨어
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();  // 사용자가 로그인한 경우 요청을 계속 진행
    }
    res.redirect('/users/login');  // 로그인하지 않은 사용자를 로그인 페이지로 리디렉션
}


// Multer 설정: 이미지 저장을 위한 설정
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads')); // 이미지가 저장될 서버상의 경로
    },
    filename: function(req, file, cb) {
        // 파일명 설정: 현재 시간 + 원본 파일명
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const uploads = multer({ storage: storage });


// 레시피 작성 페이지
router.get('/create', isAuthenticated, (req, res) => {
    res.render('posts/create-post'); // 레시피 작성 폼을 렌더링
});
const upload = multer({ storage: storage });


// 레시피 저장
router.post('/create', upload.single('image'), function(req, res) {
    const { title, plant_type, growth_environment, instructions } = req.body;
    const author_id = req.user.id; // 로그인한 사용자의 ID
    // 업로드된 파일의 경로를 저장합니다.
    const imagePath = req.file ? req.file.filename : ''; // 업로드된 파일이 있다면 파일 이름만 사용
   
    const query = 'INSERT INTO posts (title, plant_type, growth_environment, instructions, author_id, image_path) VALUES (?, ?, ?, ?, ?, ?)';

    connection.query(query, [title, plant_type, growth_environment, instructions, author_id, imagePath], function(err, results) {
        if (err) {
            console.error("Error inserting post: ", err);
            return res.redirect('/posts/create');
        }
        // INSERT 쿼리 실행 후 생성된 글의 ID를 사용하여 리다이렉트
        const newpostId = results.insertId;
        res.redirect(`/posts/${newpostId}`); // 글 상세보기 페이지로 리다이렉트
    });
});


// 레시피 detail
router.get('/:id', function(req, res) {
    const postId = req.params.id;
    const query = 'SELECT * FROM posts WHERE id = ?';

    connection.query(query, [postId], function(err, results) {
        if (err) {
            console.error("Error fetching post: ", err);
            return res.status(500).send("Internal Server Error");
        }
        if (results.length === 0) {
            return res.status(404).send("post not found");
        }
        const post = results[0];
        res.render('posts/post-detail', {
            post: post,
            user: req.user // 현재 로그인한 사용자의 정보 추가
        });
    });
});


// 레시피 수정 폼 페이지
router.get('/:id/edit', (req, res) => {
    const { id } = req.params;
    connection.query('SELECT * FROM posts WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error("Error fetching post: ", err);
            return res.status(500).send("Internal Server Error");
        }
        if (results.length > 0) {
            res.render('posts/edit-post', { post: results[0] });
        } else {
            return res.status(404).send('post not found');
        }
    });
});


// 레시피 수정 처리
router.post('/:id/edit', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { title, plant_type, growth_environment, instructions } = req.body;
    // 먼저 기존의 imagePath를 조회
    connection.query('SELECT image_path FROM posts WHERE id = ?', [id], (err, results) => {
        if (err || results.length === 0) {
            console.error("Error fetching existing image_path: ", err);
            return res.status(500).send("Internal Server Error");
        }
        let existingImagePath = results[0].image_path;

        // 새 이미지가 업로드되었다면 그 경로를 사용, 아니면 기존 경로 유지
        let imagePath = req.file ? req.file.filename : existingImagePath;

        const query = 'UPDATE posts SET title = ?, plant_type = ?, growth_environment = ?, instructions = ?, image_path = ? WHERE id = ?';
        connection.query(query, [title, plant_type, growth_environment, instructions, imagePath, id], (err) => {
            if (err) {
                console.error("Error updating post: ", err);
                return res.status(500).send("Internal Server Error");
            }
            res.redirect(`/posts/${id}`);
        });
    });
});


// 레시피 삭제 처리
router.post('/:id/delete', (req, res) => {
    const { id } = req.params;
    connection.query('DELETE FROM posts WHERE id = ?', [id], (err) => {
        if (err) {
            console.error("Error deleting post: ", err);
            return res.status(500).send("Internal Server Error");
        }
        res.redirect('/');
    });
});


// 좋아요 기능 처리
router.post('/like/:postId', async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id; // 사용자 ID, 세션 등에서 얻어온다고 가정

    try {
        // 레시피를 데이터베이스에서 조회
        const post = await post.findById(postId);

        if (!post) {
            return res.status(404).json({ success: false, message: 'post not found' });
        }

        // 좋아요 상태를 토글하고 좋아요 수 업데이트
        let isLiked = false;
        if (post.likes.includes(userId)) {
            // 이미 좋아요를 누른 상태인 경우 좋아요 취소
            post.likes.pull(userId);
        } else {
            // 좋아요를 누르지 않은 상태인 경우 좋아요 등록
            post.likes.push(userId);
            isLiked = true;
        }

        // 좋아요 수 업데이트
        const likeCount = post.likes.length;

        // 데이터베이스에 변경사항 저장
        await post.save();

        // 클라이언트에 응답 보내기
        res.status(200).json({ success: true, isLiked, likeCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});








module.exports = router;
