//--------------
document.addEventListener('DOMContentLoaded', function() {
    const followButton = document.getElementById('follow-btn');
    const unfollowButton = document.getElementById('unfollow-btn');

    if (followButton) {
        followButton.addEventListener('click', function(e) {
            e.preventDefault();
            toggleFollow(true, followButton.dataset.userId);
        });
    }

    if (unfollowButton) {
        unfollowButton.addEventListener('click', function(e) {
            e.preventDefault();
            toggleFollow(false, unfollowButton.dataset.userId);
        });
    }

    function toggleFollow(isFollow, userId) {
        const url = `/users/${isFollow ? 'follow' : 'unfollow'}/${userId}`;
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 버튼 상태를 업데이트하는 로직
                if (isFollow) {
                    followButton.style.display = 'none';
                    unfollowButton.style.display = 'block';
                    // 팔로워 수 증가
                    const followerNumberElement = document.getElementById('follower-number');
                    let followerCount = parseInt(followerNumberElement.innerText);
                    followerNumberElement.innerText = followerCount + 1;
                } else {
                    followButton.style.display = 'block';
                    unfollowButton.style.display = 'none';
                    // 팔로워 수 감소
                    const followerNumberElement = document.getElementById('follower-number');
                    let followerCount = parseInt(followerNumberElement.innerText);
                    followerNumberElement.innerText = followerCount - 1;
                }
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    }
});
