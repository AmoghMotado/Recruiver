Testing checklist (do these tests after you drop code in)

Manual register (candidate):

Leave Terms unchecked → submit → client blocks and server also rejects (should show alert).

Fill info and check Terms → should register and be redirected (or cookie set).

Manual login:

Use correct email & correct role → login succeeds → redirect to candidate or recruiter dashboard accordingly.

Use correct email but choose other role → must fail with role mismatch error.

Wrong password → must fail.

Google login:

Use a google email that is not in DB → should be blocked and not create user.

Use a google email that exists in DB but role != requested role → blocked.

Use a google email that exists and role = requested role → should set cookie and redirect to appropriate dashboard.

Forgot password:

Visit /auth/forgot — UI should match auth card design.

Back to Login button → should bring you back to / (main login page); button style should be primary (no white border).