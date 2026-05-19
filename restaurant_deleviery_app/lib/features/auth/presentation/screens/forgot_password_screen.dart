import 'package:flutter/material.dart';
import 'package:iconly/iconly.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/colors.dart';
import '../controllers/auth_controller.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isEmailVerified = false;
  bool _obscureText = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0, leading: const BackButton(color: Colors.black)),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 30),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 20),
            Text(
              _isEmailVerified ? "Reset Password" : "Forgot Password",
              style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w500, color: Color(0xFF1B3022)),
            ),
            const SizedBox(height: 10),
            Text(
              _isEmailVerified 
                ? "Enter your new password below."
                : "Enter your email to reset password.",
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 40),
            if (!_isEmailVerified)
              _buildField("Email Address", IconlyLight.message, _emailController)
            else
              _buildField("New Password", IconlyLight.lock, _passwordController, isPassword: true),
            const SizedBox(height: 40),
            Consumer<AuthController>(
              builder: (context, auth, child) {
                return SizedBox(
                  width: double.infinity,
                  height: 60,
                  child: ElevatedButton(
                    onPressed: auth.isLoading ? null : () async {
                      if (!_isEmailVerified) {
                        final success = await auth.forgotPassword(_emailController.text);
                        if (success) {
                          setState(() => _isEmailVerified = true);
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Email not found"), backgroundColor: Colors.red),
                          );
                        }
                      } else {
                        final success = await auth.resetPassword(_emailController.text, _passwordController.text);
                        if (success) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Password reset successful"), backgroundColor: Colors.green),
                          );
                          Navigator.pop(context);
                        }
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryColor,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    ),
                    child: auth.isLoading 
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text(_isEmailVerified ? "Reset Password" : "Verify Email", style: const TextStyle(color: Colors.white, fontSize: 16)),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildField(String hint, IconData icon, TextEditingController controller, {bool isPassword = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 15, offset: const Offset(0, 8))],
      ),
      child: TextField(
        controller: controller,
        obscureText: isPassword && _obscureText,
        decoration: InputDecoration(
          prefixIcon: Icon(icon, color: Colors.grey[400], size: 20),
          suffixIcon: isPassword ? IconButton(
            icon: Icon(_obscureText ? IconlyLight.show : IconlyLight.hide, color: Colors.grey),
            onPressed: () => setState(() => _obscureText = !_obscureText),
          ) : null,
          hintText: hint,
          hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 18),
        ),
      ),
    );
  }
}
