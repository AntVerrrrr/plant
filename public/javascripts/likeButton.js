
document.addEventListener('DOMContentLoaded', function() {
    const likeButton = document.getElementById('like-btn');
    
    if (likeButton) {
        likeButton.addEventListener('click', function(e) {
            e.preventDefault();
            toggleLike(likeButton.dataset.postId);
        });
    }

    function toggleLike(postId) {
        const url = `/posts/like/${postId}`;
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
                // 좋아요 버튼 상태를 업데이트하는 로직
                const likeIcon = document.getElementById('like-icon');
                const likeCount = document.getElementById('like-count');
                
                if (data.isLiked) {
                    likeIcon.classList.add('fas', 'fa-heart');
                    likeIcon.classList.remove('far', 'fa-heart');
                } else {
                    likeIcon.classList.add('far', 'fa-heart');
                    likeIcon.classList.remove('fas', 'fa-heart');
                }
                
                likeCount.innerText = data.likeCount + ' likes';
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    }
});