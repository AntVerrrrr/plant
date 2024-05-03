const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const connection = require('../models/db'); // 데이터베이스 연결 설정을 가져옴

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        // 이메일로 사용자 찾기
        connection.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                return done(err);
            }
            if (results.length === 0) {
                return done(null, false, { message: 'Incorrect email.' });
            }
            const user = results[0];
            // 비밀번호 일치 여부 확인
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            // 인증 성공
            return done(null, user);
        });
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    connection.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
        if (err) {
            return done(err);
        }
        const user = results[0];
        done(null, user);
    });
});

module.exports = passport;

//npm install passport passport-local bcryptjs express-session connect-flash