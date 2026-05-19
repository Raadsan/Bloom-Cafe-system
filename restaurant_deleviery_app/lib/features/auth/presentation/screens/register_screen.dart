import 'package:flutter/material.dart';
import 'package:iconly/iconly.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/colors.dart';
import '../controllers/auth_controller.dart';
import '../../../navigation/presentation/screens/main_navigation_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscureText = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0, leading: const BackButton(color: Colors.black)),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 30),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              const Text(
                "Create Account",
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.w500, color: Color(0xFF1B3022)),
              ),
              const SizedBox(height: 10),
              Text("Join us to enjoy best meals!", style: TextStyle(color: Colors.grey[600])),
              const SizedBox(height: 40),
              _buildField("Full Name", IconlyLight.user, _nameController),
              const SizedBox(height: 20),
              _buildField("Email", IconlyLight.message, _emailController),
              const SizedBox(height: 20),
              _buildField("Phone", IconlyLight.call, _phoneController),
              const SizedBox(height: 20),
              _buildField("Password", IconlyLight.lock, _passwordController, isPassword: true),
              const SizedBox(height: 40),
              Consumer<AuthController>(
                builder: (context, auth, child) {
                  return SizedBox(
                    width: double.infinity,
                    height: 60,
                    child: ElevatedButton(
                      onPressed: auth.isLoading ? null : () async {
                        final success = await auth.register(
                          _nameController.text,
                          _emailController.text,
                          _passwordController.text,
                          _phoneController.text,
                        );
                        if (success && mounted) {
                          Navigator.pushAndRemoveUntil(
                            context,
                            MaterialPageRoute(builder: (context) => const MainNavigationScreen()),
                            (route) => false,
                          );
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Registration failed"), backgroundColor: Colors.red),
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryColor,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                      child: auth.isLoading 
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text("Sign Up", style: TextStyle(color: Colors.white, fontSize: 16)),
                    ),
                  );
                },
              ),
              const SizedBox(height: 30),
            ],
          ),
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
