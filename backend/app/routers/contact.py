from fastapi import APIRouter

from .. import schemas

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", response_model=schemas.ContactMessageResponse)
def submit_contact_message(
    payload: schemas.ContactMessageRequest,
) -> schemas.ContactMessageResponse:
    # This validates and accepts contact messages. SMTP or CRM integration can
    # be added here without changing the frontend contract.
    return schemas.ContactMessageResponse(
        message=(
            "Votre message a été reçu. "
            "L'équipe LIAS vous contactera dès que possible."
        )
    )
