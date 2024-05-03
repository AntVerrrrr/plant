const express = require('express');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const MySQLStore = require('express-mysql-session')(session);
const mysql = require('mysql2');
const connection = require('./models/db'); // 데이터베이스 연결 설정을 가져옴
const passportConfig = require('./config/passport'); // Passport 설정을 가져옴
// const indexRouter = require('./routes/index');
// const usersRouter = require('./routes/users');
const path = require('path');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 정적 파일 제공 설정
app.use(express.static('public'));
// app.use('/public', express.static('public'))

// 레시피 정적파일
// app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 프로필 정적파일-->> 이게 더 안정적인데 위에꺼도 수정해야하나?? 질문
app.use('/profiles', express.static(path.join(__dirname, 'profiles')));

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// 세션 스토어 설정
const sessionStore = new MySQLStore({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'solofeast',
    port: 3306,
}, connection);

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
}));

// 요청 본문을 구문 분석하기 위한 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport 초기화 및 세션 사용 설정
app.use(passport.initialize());
app.use(passport.session());

// Flash 메시지 설정
app.use(flash());

// 사용자 정보를 전역적으로 사용할 수 있도록 res.locals에 저장
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    res.locals.message = req.flash('message'); // 메시지 변수를 설정합니다.
    next();
});


// 라우트 설정
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

const usersRouter = require('./routes/users');
app.use('/users', usersRouter);

const postsRouter = require('./routes/posts');
app.use('/posts', postsRouter);

const searchRouter = require('./routes/search')
app.use('/search', searchRouter);










