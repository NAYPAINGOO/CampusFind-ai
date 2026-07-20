from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_rejects_invalid_image_payload() -> None:
    response = client.post(
        "/v1/image-similarity",
        files={
            "left": ("left.png", b"not-an-image", "image/png"),
            "right": ("right.png", b"not-an-image", "image/png"),
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid or unsafe image file"


def test_compare_validates_iso_dates() -> None:
    response = client.post(
        "/v1/compare",
        json={
            "lost": {
                "title": "Black wallet",
                "description": "Black leather wallet with a blue stitch",
                "category": "Wallet",
                "primary_colour": "Black",
                "location": "Main Library",
                "incident_date": "not-a-date",
            },
            "found": {
                "title": "Black wallet",
                "description": "Black leather wallet found near a table",
                "category": "Wallet",
                "primary_colour": "Black",
                "location": "Main Library",
                "incident_date": "2026-07-17",
            },
        },
    )
    assert response.status_code == 422
