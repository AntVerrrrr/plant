var express = require('express');
var router = express.Router();
const connection = require('../models/db'); // 데이터베이스 연결 설정을 가져옵니다.

// 검색 결과 페이지의 라우트 핸들러
router.get('/', function(req, res) {
  let searchQuery = req.query.query || ''; // 사용자가 입력한 검색어
  if (!searchQuery) {
    return res.redirect('/'); // 검색어가 없으면 홈으로 리다이렉트
  }

  searchQuery = `%${searchQuery}%`; // SQL LIKE 검색을 위해 검색어 수정

  // SQL 쿼리를 사용하여 레시피 및 작성자 정보를 가져오기
  const query = `
    SELECT posts.*, users.username, users.profile_image
    FROM posts
    JOIN users ON posts.author_id = users.id
    WHERE posts.title LIKE ? OR posts.instructions LIKE ?
    ORDER BY posts.created_at DESC`;

  connection.query(query, [searchQuery, searchQuery], function(err, posts) {
    if (err) {
      console.error("Error fetching posts: ", err);
      return res.status(500).send("Internal Server Error");
    }

    // 레시피와 페이지 정보를 렌더링을 위해 전달
    res.render('search/search-results', {
      user: req.user || null, // 로그인한 사용자 정보, 미로그인 상태면 null
      posts: posts,
      query: req.query.query
    });
  });
});

module.exports = router;

