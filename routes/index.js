var express = require('express');
var router = express.Router();
const connection = require('../models/db'); // 데이터베이스 연결 설정을 가져옵니다.

// 메인 페이지의 라우트 핸들러
router.get('/', function(req, res) {
  let page = parseInt(req.query.page) || 1; // 현재 페이지 번호, 기본값은 1
  let limit = 16; // 한 페이지에 표시할 레시피의 수
  let offset = (page - 1) * limit; // 건너뛸 레시피의 수

  // 전체 레시피의 수를 조회하여 전체 페이지 수를 계산
  connection.query('SELECT COUNT(*) AS count FROM posts', function(err, data) {
    if (err) {
      console.error("Error fetching post count: ", err);
      return res.status(500).send("Internal Server Error");
    }
    let numRows = data[0].count;
    let numCols = 4; // 열의 수 (4열)
    let numPages = Math.ceil(numRows / limit); //전체 페이지수, 포스트 수가 변경됨 기존 8개였음

    // 현재 페이지에 해당하는 레시피를 조회
    // 레시피와 작성자 정보를 함께 조회
    const query = `
    SELECT posts.id, posts.title, posts.plant_type, posts.growth_environment, posts.instructions, posts.author_id, posts.created_at, posts.updated_at, posts.image_path, posts.likes_count, users.username, users.profile_image
    FROM posts
    JOIN users ON posts.author_id = users.id
    ORDER BY posts.created_at DESC LIMIT ? OFFSET ?`;
    
    connection.query(query, [limit, offset], function(err, posts) {
      if (err) {
        console.error("Error fetching posts: ", err);
        return res.status(500).send("Internal Server Error");
      }
      // 조회된 레시피와 페이지네이션 정보를 뷰로 전달하여 렌더링
      res.render('index', {
        user: req.user || null, // 로그인한 사용자 정보, 미로그인 상태면 null
        posts: posts, // 조회된 레시피 목록
        numPages: numPages, // 전체 페이지 수
        currentPage: page // 현재 페이지 번호
      });
    });
  });

});

module.exports = router;