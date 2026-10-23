// Re-export / alias for the verification suite matching both invocation styles:
// flutter test integration_test/verification_test.dart
// flutter test integration_test/app_verification_test.dart

import 'app_verification_test.dart' as app_test;

void main() {
  app_test.main();
}
