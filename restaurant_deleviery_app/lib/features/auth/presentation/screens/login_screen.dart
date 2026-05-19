import 'package:flutter/material.dart';
import 'package:iconly/iconly.dart';
import '../../../../core/theme/colors.dart';
import 'package:provider/provider.dart';
import '../controllers/auth_controller.dart';
import 'register_screen.dart';
import 'forgot_password_screen.dart';
import '../../../navigation/presentation/screens/main_navigation_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscureText = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        child: Container(
          constraints: BoxConstraints(
            minHeight: MediaQuery.of(context).size.height,
          ),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [AppColors.bgColor, Colors.white],
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 30),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 80),
                Center(
                  child: Container(
                    height: 100,
                    width: 100,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.restaurant,
                      color: Colors.green,
                      size: 50,
                    ),
                  ),
                ),
                const SizedBox(height: 40),
                const Text(
                  "Login to Your Account",
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w500,
                    fontFamily: "Poppins",
                    color: Color(0xFF1B3022),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  "Welcome back! Please enter your details.",
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                    fontFamily: "Poppins",
                  ),
                ),
                const SizedBox(height: 40),
                _buildTextField(
                  IconlyLight.message,
                  "Email",
                  false,
                  controller: _emailController,
                ),
                const SizedBox(height: 20),
                _buildTextField(
                  IconlyLight.lock,
                  "Password",
                  true,
                  controller: _passwordController,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscureText ? IconlyLight.show : IconlyLight.hide,
                      color: Colors.grey,
                    ),
                    onPressed: () =>
                        setState(() => _obscureText = !_obscureText),
                  ),
                ),
                const SizedBox(height: 15),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const ForgotPasswordScreen(),
                        ),
                      );
                    },
                    child: const Text(
                      "Forgot Password?",
                      style: TextStyle(
                        color: Colors.green,
                        fontFamily: "Poppins",
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 30),
                Consumer<AuthController>(
                  builder: (context, auth, child) {
                    return SizedBox(
                      width: double.infinity,
                      height: 60,
                      child: ElevatedButton(
                        onPressed: auth.isLoading
                            ? null
                            : () async {
                                final success = await auth.login(
                                  _emailController.text,
                                  _passwordController.text,
                                );
                                if (success && mounted) {
                                  Navigator.pushReplacement(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          const MainNavigationScreen(),
                                    ),
                                  );
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        "Invalid email or password",
                                      ),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryColor,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                          elevation: 5,
                          shadowColor: AppColors.primaryColor.withOpacity(0.4),
                        ),
                        child: auth.isLoading
                            ? const CircularProgressIndicator(
                                color: Colors.white,
                              )
                            : const Text(
                                "Sign In",
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                  fontFamily: "Poppins",
                                ),
                              ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 30),
                const Row(
                  children: [
                    Expanded(child: Divider()),
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 10),
                      child: Text(
                        "Or continue with",
                        style: TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ),
                    Expanded(child: Divider()),
                  ],
                ),
                const SizedBox(height: 30),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildSocialBtn("assets/images/google.png"),
                    const SizedBox(width: 20),
                    // _buildSocialBtn("assets/images/facebook.png"),
                  ],
                ),
                const SizedBox(height: 40),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      "Don't have an account?",
                      style: TextStyle(fontFamily: "Poppins"),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const RegisterScreen(),
                          ),
                        );
                      },
                      child: const Text(
                        "Sign Up",
                        style: TextStyle(
                          color: Colors.green,
                          fontWeight: FontWeight.w500,
                          fontFamily: "Poppins",
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(
    IconData icon,
    String hint,
    bool isPassword, {
    Widget? suffixIcon,
    required TextEditingController controller,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: TextField(
        controller: controller,
        obscureText: isPassword && _obscureText,
        decoration: InputDecoration(
          prefixIcon: Icon(icon, color: Colors.grey[400], size: 20),
          suffixIcon: suffixIcon,
          hintText: hint,
          hintStyle: TextStyle(
            color: Colors.grey[400],
            fontSize: 14,
            fontFamily: "Poppins",
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 18),
        ),
      ),
    );
  }

  Widget _buildSocialBtn(String imagePath) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Image.asset(
        imagePath,
        height: 25,
        width: 25,
        errorBuilder: (context, error, stackTrace) =>
            const Icon(Icons.error_outline, size: 25),
      ),
    );
  }
}
