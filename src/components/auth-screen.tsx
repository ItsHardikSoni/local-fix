import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '../constants/theme';
import { useUser } from '../context/UserContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { supabaseConfigured } from '../lib/supabase';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\d{10}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

export default function AuthScreen() {
  const { signIn, signUp } = useUser();
  const scrollAreaRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const focusedInputRef = useRef<TextInput | null>(null);
  const inputRefs = {
    fullName: useRef<TextInput>(null),
    phone: useRef<TextInput>(null),
    email: useRef<TextInput>(null),
    password: useRef<TextInput>(null),
  };
  const scrollOffsetRef = useRef(0);
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const scrollFocusedInputIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      const input = focusedInputRef.current;
      const keyboardTop = Keyboard.metrics()?.screenY;
      if (!input || keyboardTop === undefined) return;

      input.measureInWindow((_inputX, inputY, _inputWidth, inputHeight) => {
        scrollAreaRef.current?.measureInWindow((_areaX, areaY, _areaWidth, areaHeight) => {
          const areaBottom = Math.min(areaY + areaHeight, keyboardTop);
          const inputBottom = inputY + inputHeight;
          const bottomGap = areaBottom - inputBottom;
          const scrollDelta = bottomGap < 24
            ? 24 - bottomGap
            : inputY < areaY + 16
              ? inputY - (areaY + 16)
              : 0;

          if (scrollDelta !== 0) {
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, scrollOffsetRef.current + scrollDelta),
              animated: true,
            });
          }
        });
      });
    });
  }, []);

  const focusInput = useCallback((input: TextInput | null) => {
    focusedInputRef.current = input;
    scrollFocusedInputIntoView();
  }, [scrollFocusedInputIntoView]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      scrollFocusedInputIntoView();
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      scrollOffsetRef.current = 0;
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [scrollFocusedInputIntoView]);

  const submit = async () => {
    setBusy(true);
    setMessage('');
    setIsError(false);

    try {
      if (mode === 'signIn') {
        const error = await signIn(email.trim(), password);
        if (error) {
          setMessage(error.message);
          setIsError(true);
        }
      } else {
        const result = await signUp(email.trim(), password, fullName.trim(), phone.trim());
        if (result.error) {
          setMessage(result.error.message);
          setIsError(true);
        } else if (result.confirmationRequired) {
          setMessage('Check your email to confirm your account, then sign in.');
        }
      }
    } catch {
      setMessage('Unable to connect right now. Please try again.');
      setIsError(true);
    } finally {
      setBusy(false);
    }
  };

  const isSignUp = mode === 'signUp';
  const isEmailValid = EMAIL_PATTERN.test(email.trim());
  const isPhoneValid = PHONE_PATTERN.test(phone);
  const isPasswordStrong = PASSWORD_PATTERN.test(password);
  const canSubmit = isEmailValid && (
    isSignUp
      ? Boolean(fullName.trim()) && isPhoneValid && isPasswordStrong
      : Boolean(password)
  );

  return (
    <View style={styles.page}>
      <View ref={scrollAreaRef} style={styles.scrollArea}>
        <ScrollView
          ref={scrollViewRef}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={styles.content}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          onScroll={(event) => {
            scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          {!keyboardVisible ? <View style={styles.header}>
            <Image
              accessibilityLabel="LocalFix logo"
              resizeMode="contain"
              source={require('../../assets/Icon.png')}
              style={styles.headerLogo}
            />
            <Text style={styles.wordmark}>LocalFix</Text>
            <Text style={styles.tagline}>Home repairs, handled.</Text>
          </View> : null}

          <View style={styles.form}>
          <Text style={styles.heading}>{isSignUp ? 'Create your account' : 'Welcome back'}</Text>
          <Text style={styles.description}>
            {isSignUp ? 'Get trusted local help when you need it.' : 'Sign in to continue to your home.'}
          </Text>

          {!supabaseConfigured ? (
            <Text style={[styles.message, styles.error]}>
              Add your Supabase URL and publishable key to the root .env file to enable sign in.
            </Text>
          ) : null}

          <View style={styles.switcher}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: !isSignUp }}
              onPress={() => { setMode('signIn'); setMessage(''); }}
              style={[styles.switchOption, !isSignUp && styles.switchOptionSelected]}
            >
              <Text style={[styles.switchText, !isSignUp && styles.switchTextSelected]}>Sign in</Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: isSignUp }}
              onPress={() => { setMode('signUp'); setMessage(''); }}
              style={[styles.switchOption, isSignUp && styles.switchOptionSelected]}
            >
              <Text style={[styles.switchText, isSignUp && styles.switchTextSelected]}>Sign up</Text>
            </Pressable>
          </View>

          {isSignUp ? (
            <>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                ref={inputRefs.fullName}
                autoCapitalize="words"
                autoComplete="name"
                onChangeText={setFullName}
                onFocus={() => focusInput(inputRefs.fullName.current)}
                placeholder="Your full name"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.input}
                value={fullName}
              />

              <Text style={styles.label}>Phone number</Text>
              <TextInput
                ref={inputRefs.phone}
                autoComplete="tel"
                keyboardType="number-pad"
                onChangeText={(value) => setPhone(value.replace(/\D/g, ''))}
                onFocus={() => focusInput(inputRefs.phone.current)}
                placeholder="10-digit phone number"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.input}
                value={phone}
              />
              {phone.length > 0 && !isPhoneValid ? (
                <Text style={styles.validation}>Enter exactly 10 digits.</Text>
              ) : null}
            </>
          ) : null}

          <Text style={styles.label}>Email address</Text>
          <TextInput
            ref={inputRefs.email}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            onFocus={() => focusInput(inputRefs.email.current)}
            placeholder="you@example.com"
            placeholderTextColor={Colors.light.textSecondary}
            style={styles.input}
            value={email}
          />
          {email.length > 0 && !isEmailValid ? (
            <Text style={styles.validation}>Enter a valid email address.</Text>
          ) : null}

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordField}>
            <TextInput
              ref={inputRefs.password}
              autoCapitalize="none"
              autoComplete={isSignUp ? 'new-password' : 'password'}
              onChangeText={setPassword}
              onFocus={() => focusInput(inputRefs.password.current)}
              placeholder={isSignUp ? '8+ characters with upper/lowercase, number, symbol' : 'Your password'}
              placeholderTextColor={Colors.light.textSecondary}
              secureTextEntry={!passwordVisible}
              style={[styles.input, styles.passwordInput]}
              value={password}
            />
            <Pressable
              accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
              accessibilityRole="button"
              accessibilityState={{ checked: passwordVisible }}
              hitSlop={8}
              onPress={() => setPasswordVisible((visible) => !visible)}
              style={({ pressed }) => [styles.passwordToggle, pressed && styles.passwordTogglePressed]}
            >
              <MaterialIcons
                name={passwordVisible ? 'visibility-off' : 'visibility'}
                size={22}
                color={Colors.light.textSecondary}
              />
            </Pressable>
          </View>
          {isSignUp && password.length > 0 && !isPasswordStrong ? (
            <Text style={styles.validation}>
              Use at least 8 characters with uppercase, lowercase, a number, and a special character.
            </Text>
          ) : null}

          {message ? (
            <Text accessibilityRole="alert" style={[styles.message, isError && styles.error]}>
              {message}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={busy || !canSubmit}
            onPress={submit}
            style={({ pressed }) => [styles.submit, pressed && styles.submitPressed, (busy || !canSubmit) && styles.submitDisabled]}
          >
            {busy ? <ActivityIndicator color={Colors.light.text} /> : (
              <Text style={styles.submitText}>{isSignUp ? 'Create account' : 'Sign in'}</Text>
            )}
          </Pressable>
          </View>
        </ScrollView>
      </View>
      <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.light.background },
  scrollArea: { flex: 1 },
  bottomSafeArea: { backgroundColor: Colors.light.background },
  content: { flexGrow: 1, paddingBottom: 24 },
  header: {
    minHeight: 245,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 28,
    backgroundColor: Colors.light.text,
  },
  headerLogo: { width: 60, height: 60, borderRadius: 12 },
  wordmark: { marginTop: 18, color: Colors.light.backgroundElement, fontSize: 30, fontWeight: '800' },
  tagline: { marginTop: 5, color: '#D6DFEA', fontSize: 15 },
  form: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: 24 },
  heading: { color: Colors.light.text, fontSize: 23, fontWeight: '700' },
  description: { marginTop: 7, marginBottom: 22, color: Colors.light.textSecondary, fontSize: 14 },
  switcher: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 22,
    borderRadius: 10,
    backgroundColor: '#E9EEF4',
  },
  switchOption: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 7 },
  switchOptionSelected: { backgroundColor: Colors.light.backgroundElement },
  switchText: { color: Colors.light.textSecondary, fontSize: 14, fontWeight: '600' },
  switchTextSelected: { color: Colors.light.text },
  label: { marginBottom: 8, color: Colors.light.text, fontSize: 13, fontWeight: '600' },
  validation: { marginTop: -12, marginBottom: 14, color: '#B42318', fontSize: 12, lineHeight: 17 },
  passwordField: { position: 'relative' },
  passwordInput: { paddingRight: 56 },
  passwordToggle: {
    position: 'absolute',
    top: 0,
    right: 4,
    width: 48,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  passwordTogglePressed: { opacity: 0.65 },
  input: {
    minHeight: 50,
    marginBottom: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#D8E0E9',
    borderRadius: 8,
    backgroundColor: Colors.light.backgroundElement,
    color: Colors.light.text,
    fontSize: 15,
  },
  message: { marginBottom: 14, color: '#24734A', fontSize: 13, lineHeight: 19 },
  error: { color: '#B42318' },
  submit: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    borderRadius: 8,
    backgroundColor: Colors.light.backgroundSelected,
  },
  submitPressed: { opacity: 0.85 },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: Colors.light.text, fontSize: 15, fontWeight: '700' },
});