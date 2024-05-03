const connection = require('./db');

const Post = {};

// Post 모델에서 사용할 메서드들을 정의합니다.
Post.getAll = function(callback) {
    connection.query('SELECT * FROM posts', callback);
};

Post.getById = function(id, callback) {
    connection.query('SELECT * FROM posts WHERE id = ?', [id], callback);
};

Post.create = function(newPost, callback) {
    connection.query('INSERT INTO posts SET ?', newPost, callback);
};

Post.update = function(id, updatedPost, callback) {
    connection.query('UPDATE posts SET ? WHERE id = ?', [updatedPost, id], callback);
};

Post.remove = function(id, callback) {
    connection.query('DELETE FROM posts WHERE id = ?', [id], callback);
};

module.exports = Post;
