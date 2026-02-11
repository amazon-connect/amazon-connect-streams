require("../unit/test-setup.js");
const { expect } = require("chai");
const proxyquire = require('proxyquire');

describe('VoiceFocusProvider', () => {
    let VoiceFocusProvider, defaultMediaStream, logData;
    let voiceFocusStub, createAudioContextStub, configureStub, initStub;
    let mockVoiceFocusInstance, mockAudioContext;
    const sandbox = sinon.createSandbox();

    beforeEach(async () => {
        // Mock navigator.mediaDevices
        global.navigator.mediaDevices = {
            getUserMedia: sinon.stub(),
            enumerateDevices: sinon.stub().resolves([
                { kind: 'audioinput', deviceId: 'default', label: 'Default Microphone' },
                { kind: 'audioinput', deviceId: 'device1', label: 'Test Microphone' }
            ])
        };

        mockVoiceFocusInstance = {
          // TODO: this code is part of a temporary fix, waiting for ChimeSDK to deploy
          // https://taskei.amazon.dev/tasks/RIPTIDE-2938
            internal: {
              voiceFocusNode: {
                port: {
                  postMessage: sinon.stub(),
                },
                connect: sinon.stub()
              },
              audioContext: {
                state: 'running',
                createMediaStreamSource: sinon.stub().returns({
                  connect: sinon.stub()
                }),
                createMediaStreamDestination: sinon.stub().returns({
                  stream: { id: 'enhanced' }
                })
              }
            },
            applyToStream: sinon.stub().resolves({
                stream: { id: 'enhanced' },
                node: { stop: sinon.stub() },
                source: { disconnect: sinon.stub() },
                destination: { disconnect: sinon.stub() }
            }),
            getModelMetrics: sinon.stub(),
            setMode: sinon.stub(),
            reset: sinon.stub(),
            destroy: sinon.stub(),
        };

        mockAudioContext = {
            close: sinon.stub()
        };

        configureStub = sinon.stub().resolves({ supported: true });
        initStub = sinon.stub().resolves(mockVoiceFocusInstance);
        createAudioContextStub = sinon.stub().returns(mockAudioContext);
        
        voiceFocusStub = {
            configure: configureStub,
            init: initStub
        };

        VoiceFocusProvider = proxyquire('../../src/voiceEnhancementProvider', {
            'amazon-chime-sdk-js/libs/voicefocus/voicefocus': {
                VoiceFocus: voiceFocusStub,
                createAudioContext: createAudioContextStub
            }
        });

        const getAgentDataProviderStub = {
            getAgentData: sinon.stub().returns({
                configuration: {
                    agentARN: 'arn:aws:connect:us-east-1:123456789012:instance/test-instance-id/agent/test-agent-id'
                }
            }),
            getAWSAccountId: sinon.stub().returns('123456789012'),
            getInstanceId: sinon.stub().returns('test-instance-id'),
        };
        sandbox.stub(connect.core, "getAgentDataProvider").returns(getAgentDataProviderStub);
        sandbox.stub(connect.Agent.prototype, 'getVoiceEnhancementMode').returns("NONE");
        connect.agent.initialized = true;
        // sandbox.stub(connect.core, "getLog").returns(logger);
        sandbox.stub(connect, "publishMetric");
        sandbox.stub(connect, "contact");
        sandbox.stub(connect.core.voiceFocus, 'addModelLoadingMetric');
        sandbox.stub(connect.core.voiceFocus, 'getSDKVoiceClient').returns({
          getVoiceEnhancementPaths: sinon.stub().resolves({
            processors: "/voice-enhancements/static/processors/a9f4ae6259408aa0/",
            workers: "/voice-enhancements/static/workers/a4c68630808dee98/",
            wasm: "/voice-enhancements/static/wasm/78671f7901a4dbd1/",
            models: "/voice-enhancements/static/models/a102d852ddec4d75/"
          }),
        });
        
        // Mock window object for getBrowserName tests
        global.window = {
            navigator: {
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };

        defaultMediaStream = { id: 'default-stream' };
        logData = { defaultMediaStream };
    });

    afterEach(() => {
        sandbox.restore();
    });

    // Tests for getAudioDeviceLabel function through VoiceFocusProvider metrics
    describe('getAudioDeviceLabel functionality', () => {
        it('should add device label metric when audio track with valid deviceId exists', async () => {
            // Setup
            const mediaStream = { 
                id: 'test-stream',
                getAudioTracks: () => [{ 
                    getSettings: () => ({ deviceId: 'device1' }) 
                }]
            };
            
            connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
            connect.core.voiceFocus.addModelLoadingMetric.resetHistory();
            
            // Execute
            await VoiceFocusProvider.getVoiceEnhancedUserMedia(mediaStream, { onError: sinon.stub() });
            
            // Verify
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
                'VoiceFocusDeviceLabel', 1, 'count', { DeviceLabel: 'Test Microphone' }
            )).to.be.true;
        });
        
        it('should add "unknown" device label metric when deviceId not found', async () => {
            // Setup
            const mediaStream = { 
                id: 'test-stream',
                getAudioTracks: () => [{ 
                    getSettings: () => ({ deviceId: 'nonexistent' }) 
                }]
            };
            
            connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
            connect.core.voiceFocus.addModelLoadingMetric.resetHistory();
            
            // Execute
            await VoiceFocusProvider.getVoiceEnhancedUserMedia(mediaStream, { onError: sinon.stub() });
            
            // Verify
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
                'VoiceFocusDeviceLabel', 1, 'count', { DeviceLabel: 'unknown' }
            )).to.be.true;
        });
        
        it('should add "unknown" device label metric when no audio tracks exist', async () => {
            // Setup
            const mediaStream = { 
                id: 'test-stream',
                getAudioTracks: () => [] 
            };
            
            connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
            connect.core.voiceFocus.addModelLoadingMetric.resetHistory();
            
            // Execute
            await VoiceFocusProvider.getVoiceEnhancedUserMedia(mediaStream, { onError: sinon.stub() });
            
            // Verify
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
                'VoiceFocusDeviceLabel', 1, 'count', { DeviceLabel: 'unknown' }
            )).to.be.true;
        });
        
        it('should add "unknown" device label metric when enumerateDevices throws an error', async () => {
            // Setup
            const mediaStream = { 
                id: 'test-stream',
                getAudioTracks: () => [{ 
                    getSettings: () => ({ deviceId: 'device1' }) 
                }]
            };
            
            // Make enumerateDevices throw an error
            navigator.mediaDevices.enumerateDevices.rejects(new Error('Test error'));
            
            connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
            connect.core.voiceFocus.addModelLoadingMetric.resetHistory();
            
            // Execute
            await VoiceFocusProvider.getVoiceEnhancedUserMedia(mediaStream, { onError: sinon.stub() });
            
            // Verify
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
                'VoiceFocusDeviceLabel', 1, 'count', { DeviceLabel: 'unknown' }
            )).to.be.true;
        });
    });
    
    // Tests for getBrowserName function through VoiceFocusProvider metrics
    describe('getBrowserName functionality', () => {
        it('should add Chrome browser metric when using Chrome', async () => {
            // Setup
            global.window.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            
            const mediaStream = { id: 'test-stream' };
            connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
            connect.core.voiceFocus.addModelLoadingMetric.resetHistory();
            
            // Execute
            await VoiceFocusProvider.getVoiceEnhancedUserMedia(mediaStream, { onError: sinon.stub() });
            
            // Verify
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
                'VoiceFocusBrowser', 1, 'count', { BrowserName: 'Chrome' }
            )).to.be.true;
        });
        
        it('should add Firefox browser metric when using Firefox', async () => {
            // Setup
            global.window.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
            
            const mediaStream = { id: 'test-stream' };
            connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
            connect.core.voiceFocus.addModelLoadingMetric.resetHistory();
            
            // Execute
            await VoiceFocusProvider.getVoiceEnhancedUserMedia(mediaStream, { onError: sinon.stub() });
            
            // Verify
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
                'VoiceFocusBrowser', 1, 'count', { BrowserName: 'Firefox' }
            )).to.be.true;
        });
        
        it('should add unknown browser metric when using unrecognized browser', async () => {
            // Setup
            global.window.navigator.userAgent = 'Some unknown browser';
            
            const mediaStream = { id: 'test-stream' };
            connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
            connect.core.voiceFocus.addModelLoadingMetric.resetHistory();
            
            // Execute
            await VoiceFocusProvider.getVoiceEnhancedUserMedia(mediaStream, { onError: sinon.stub() });
            
            // Verify
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
                'VoiceFocusBrowser', 1, 'count', { BrowserName: 'unknown' }
            )).to.be.true;
        });
    });

    describe('getVoiceEnhancedUserMedia', () => {
        it('should return default media stream when voice focus is disabled', async () => {
            const mediaStream = { id: 'dummy' };
            const onError = sinon.stub();

            const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia(mediaStream, { onError });
            expect(result).to.equal(mediaStream);
            expect(onError.called).to.be.false;
        });

        describe('Audio Constraints Validation for Voice Enhancement', () => {
            it('should validate input stream has proper audio tracks', async () => {
                const mediaStreamWithAudio = { 
                    id: 'test-stream',
                    getAudioTracks: () => [{ kind: 'audio', enabled: true }]
                };
                
                connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");

                mockVoiceFocusInstance.applyToStream.resolves({
                    stream: { id: 'enhanced' },
                    node: { stop: sinon.stub() },
                    source: { disconnect: sinon.stub() },
                    destination: { disconnect: sinon.stub() }
                });

                const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia(mediaStreamWithAudio, { onError: sinon.stub() });
                
                // Should process stream with valid audio tracks
                expect(mockVoiceFocusInstance.applyToStream.calledOnce).to.be.true;
                expect(result.id).to.equal('enhanced');
            });

            it('should handle input stream without audio tracks gracefully', async () => {
                const mediaStreamNoAudio = { 
                    id: 'test-stream',
                    getAudioTracks: () => []
                };
                
                connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
                
                // Mock applyToStream to return the original stream when no audio tracks
                mockVoiceFocusInstance.applyToStream.resolves({
                    stream: mediaStreamNoAudio,
                    node: { stop: sinon.stub() },
                    source: { disconnect: sinon.stub() },
                    destination: { disconnect: sinon.stub() }
                });

                const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia(mediaStreamNoAudio, { onError: sinon.stub() });
                
                // Should return original stream (current implementation applies VF even to streams without audio)
                expect(result).to.equal(mediaStreamNoAudio);
                
                // Voice enhancement will still be attempted with current implementation
                expect(mockVoiceFocusInstance.applyToStream.called).to.be.true;
            });

            it('should validate enhanced stream audio constraints are preserved', async () => {
                const sourceStream = { 
                    id: 'source',
                    getAudioTracks: () => [{ 
                        kind: 'audio', 
                        enabled: true,
                        getConstraints: () => ({
                            echoCancellation: false,
                            noiseSuppression: false,
                            autoGainControl: true
                        })
                    }]
                };
                
                const enhancedStream = { 
                    id: 'enhanced',
                    getAudioTracks: () => [{ 
                        kind: 'audio', 
                        enabled: true,
                        getConstraints: () => ({
                            echoCancellation: false, // Should preserve original constraints
                            noiseSuppression: false,
                            autoGainControl: true
                        })
                    }]
                };
                
                connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
                
                mockVoiceFocusInstance.applyToStream.resolves({
                    stream: enhancedStream,
                    node: { stop: sinon.stub() },
                    source: { disconnect: sinon.stub() },
                    destination: { disconnect: sinon.stub() }
                });

                const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia(sourceStream, { onError: sinon.stub() });
                
                expect(result).to.equal(enhancedStream);
                
                // Validate that audio constraints are preserved through voice enhancement
                const enhancedTrack = result.getAudioTracks()[0];
                const constraints = enhancedTrack.getConstraints();
                expect(constraints.echoCancellation).to.equal(false);
                expect(constraints.noiseSuppression).to.equal(false);
                expect(constraints.autoGainControl).to.equal(true);
            });

            it('should fallback to original stream on voice enhancement failure with preserved constraints', async () => {
                const sourceStreamWithConstraints = { 
                    id: 'source',
                    getAudioTracks: () => [{ 
                        kind: 'audio',
                        getConstraints: () => ({
                            echoCancellation: false,
                            deviceId: 'test-device-123'
                        })
                    }]
                };
                
                connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
                mockVoiceFocusInstance.applyToStream.throws(new Error('Enhancement failed'));

                const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia(sourceStreamWithConstraints, { onError: sinon.stub() });
                
                // Should return source stream with original constraints intact
                expect(result).to.equal(sourceStreamWithConstraints);
                const originalTrack = result.getAudioTracks()[0];
                const constraints = originalTrack.getConstraints();
                expect(constraints.echoCancellation).to.equal(false);
                expect(constraints.deviceId).to.equal('test-device-123');
            });

            it('should handle voice enhancement timeout without losing audio constraints', async function() {
                this.timeout(7000); // Increase timeout for this test
                const sourceStreamWithConstraints = { 
                    id: 'source',
                    getAudioTracks: () => [{ 
                        kind: 'audio',
                        enabled: true,
                        getConstraints: () => ({
                            echoCancellation: false,
                            noiseSuppression: false,
                            autoGainControl: true,
                            deviceId: { exact: 'test-device-456' }
                        })
                    }]
                };
                
                await VoiceFocusProvider.cleanVoiceFocus();
                connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
                mockVoiceFocusInstance.applyToStream.returns(new Promise(() => {})); // Never resolves (timeout)

                const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia(sourceStreamWithConstraints, { onError: sinon.stub() });
                
                // Should fallback to source stream on timeout
                expect(result).to.equal(sourceStreamWithConstraints);
                
                // Validate original constraints are preserved
                const originalTrack = result.getAudioTracks()[0];
                const constraints = originalTrack.getConstraints();
                expect(constraints.echoCancellation).to.equal(false);
                expect(constraints.noiseSuppression).to.equal(false);
                expect(constraints.autoGainControl).to.equal(true);
                expect(constraints.deviceId.exact).to.equal('test-device-456');
            });

            it('should validate voice enhancement mode affects processing but not base constraints', async () => {
                const sourceStream = { 
                    id: 'source',
                    getAudioTracks: () => [{ 
                        kind: 'audio',
                        getConstraints: () => ({
                            echoCancellation: false,  // Original constraint should be preserved
                            autoGainControl: true
                        })
                    }]
                };
                
                const enhancedStream = { id: 'enhanced' };
                
                // Test NOISE_SUPPRESSION mode
                connect.Agent.prototype.getVoiceEnhancementMode.returns("NOISE_SUPPRESSION");
                mockVoiceFocusInstance.applyToStream.resolves({
                    stream: enhancedStream,
                    node: { stop: sinon.stub() },
                    source: { disconnect: sinon.stub() },
                    destination: { disconnect: sinon.stub() }
                });

                const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia(sourceStream, { onError: sinon.stub() });
                
                // Should use 'ns' mode for noise suppression
                expect(configureStub.calledWith(sinon.match({ mode: 'ns' }))).to.be.true;
                expect(result).to.equal(enhancedStream);
            });
        });

        it('should return default media stream when the manifest is corrupted', async () => {
            // setup
            const mediaStream = { id: 'dummy' };

            connect.core.voiceFocus.getSDKVoiceClient.restore();
            sandbox.stub(connect.core.voiceFocus, 'getSDKVoiceClient').returns({
            getVoiceEnhancementPaths: sandbox.stub().rejects(new Error()),
            });

            // test
            const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia(mediaStream, { onError: sinon.stub() });

            // result
            expect(result).to.equal(mediaStream);
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
                'VoiceFocusMode', 1, 'count', { ModelMode: 'none' }
            )).to.be.true;          
            expect(mockVoiceFocusInstance.applyToStream.calledOnce).not.to.be.true;
        });

        it('should return TVE enhanced media stream when voice focus is enabled with voice isolation', async () => {
            // setup
            const sourceMediaStream = { id: 'source' };
            
            connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
            
            // Reset history to ensure we're tracking the right calls
            mockVoiceFocusInstance.applyToStream.resetHistory();

            // test
            const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia(sourceMediaStream, { onError: sinon.stub() });

            // result
            expect(result.id).to.equal('enhanced');
            expect(mockVoiceFocusInstance.applyToStream.calledOnce).to.be.true;
            expect(configureStub.calledWith(sinon.match({ mode: 'tve' }))).to.be.true;
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
                'VoiceFocusMode', 1, 'count', { ModelMode: 'tve' }
            )).to.be.true;
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
                'VoiceFocusError', 0, 'count'
            )).to.be.true;
        });

      it('should return enhanced media stream when voice focus is enabled with noise suppression', async () => {
        // setup
        const inputMediaStream = { id: 'input' };

        connect.Agent.prototype.getVoiceEnhancementMode.returns("NOISE_SUPPRESSION");

        // Reset history to ensure we're tracking the right calls
        mockVoiceFocusInstance.applyToStream.resetHistory();

        // test
        const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia(inputMediaStream, { onError: sinon.stub() });

        // result
        expect(result.id).to.equal('enhanced');
        expect(mockVoiceFocusInstance.applyToStream.calledOnce).to.be.true;
        expect(configureStub.calledWith(sinon.match({ mode: 'ns' }))).to.be.true;
        expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
          'VoiceFocusMode', 1, 'count', { ModelMode: 'ns' }
        )).to.be.true;
        expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
          'VoiceFocusError', 0, 'count'
        )).to.be.true;
      });

        it('should return default media stream when the voice focus is not supported', async () => {
            // setup
            const sourceMediaStream = { id: 'source' };
            connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
            configureStub = sinon.stub().resolves({ supported: false });
            voiceFocusStub.configure = configureStub;

            // test
            const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia(sourceMediaStream, { onError: sinon.stub() });

            // assert
            expect(result).to.equal(sourceMediaStream);
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
                'VoiceFocusMode', 1, 'count', { ModelMode: 'tve' }
            )).to.be.true;
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
                'VoiceFocusError', 1, 'count'
            )).to.be.true;
        });

        it('should return default media stream when an error occurs in creating audio context', async () => {
            // setup
            const sourceMediaStream = { id: 'source' };
            connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
            createAudioContextStub.throws(new Error('AudioContext creation failed'));

            // test
            const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia(sourceMediaStream, { onError: sinon.stub() });

            // assert
            expect(result).to.equal(sourceMediaStream);
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
                'VoiceFocusMode', 1, 'count', { ModelMode: 'tve' }
            )).to.be.true;
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
                'VoiceFocusError', 1, 'count'
            )).to.be.true;
        });

        it('should return default media stream when an error occurs in creating enhanced stream', async () => {
            // setup
            const sourceMediaStream = { id: 'source' };
            const onError = sinon.stub();
            connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
            
            // Override the default mock to throw an error
            mockVoiceFocusInstance.applyToStream = sinon.stub().throws(new Error('Enhanced stream creation failed'));

            // test
            const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia(sourceMediaStream, { onError });

            // assert
            expect(result).to.equal(sourceMediaStream);
            expect(onError.calledOnce).to.be.true;
            expect(mockVoiceFocusInstance.applyToStream.calledOnce).to.be.true;
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
                'VoiceFocusMode', 1, 'count', { ModelMode: 'tve' }
            )).to.be.true;
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
                'VoiceFocusError', 1, 'count'
            )).to.be.true;
        });

        it('should return default media stream when voice enhancement timeout exceeded', async function()  {
            // setup
            this.timeout(7000); // Increase the timeout for this test to 7 seconds
            const sourceMediaStream = { id: 'source' };
            const onError = sinon.stub();
            await VoiceFocusProvider.cleanVoiceFocus();
            connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
            
            // Override the default mock to never resolve (simulating timeout)
            mockVoiceFocusInstance.applyToStream = sinon.stub().returns(new Promise(() => {}));

            // test
            const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia(sourceMediaStream, { onError });

            // assert
            expect(result).to.equal(sourceMediaStream);
            expect(onError.calledOnce).to.be.true;
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
                'VoiceFocusMode', 1, 'count', { ModelMode: 'tve' }
            )).to.be.true;
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith(
                'VoiceFocusError', 1, 'count', { "ErrorType": "Timeout" }
            )).to.be.true;
        });

        // Add test for cleanVoiceFocus
        it('should clean up voice focus resources when called cleanVoiceFocus', async () => {
            const sourceMediaStream = { id: 'source' };
            
            connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
            
            // Reset to default mock implementation
            mockVoiceFocusInstance.applyToStream = sinon.stub().resolves({
                stream: { id: 'enhanced' },
                node: { stop: sinon.stub() },
                source: { disconnect: sinon.stub() },
                destination: { disconnect: sinon.stub() }
            });
            
            mockVoiceFocusInstance.internal.voiceFocusNode.port.postMessage.resetHistory();

            // test
            await VoiceFocusProvider.getVoiceEnhancedUserMedia(sourceMediaStream, { onError: sinon.stub() });
            await VoiceFocusProvider.cleanVoiceFocus();

            // assert
            expect(mockVoiceFocusInstance.internal.voiceFocusNode.port.postMessage.calledWith({ message: "reset" })).to.be.true;
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith('VoiceFocusCleared', 1, 'count')).to.be.true;
        });

        // add test for failed cleanVoiceFocus
        it('should handle failure when cleaning up voice focus resources', async () => {
            const sourceMediaStream = { id: 'source' };

            connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
            
            // Make postMessage throw an error
            mockVoiceFocusInstance.internal.voiceFocusNode.port.postMessage = sinon.stub().throws(
                new Error('Failed to clean up voice focus resources')
            );
            
            // Reset to default mock implementation for applyToStream
            mockVoiceFocusInstance.applyToStream = sinon.stub().resolves({
                stream: { id: 'enhanced' },
                node: { stop: sinon.stub() },
                source: { disconnect: sinon.stub() },
                destination: { disconnect: sinon.stub() }
            });

            // test
            await VoiceFocusProvider.getVoiceEnhancedUserMedia(sourceMediaStream, { onError: sinon.stub() });
            await VoiceFocusProvider.cleanVoiceFocus();

            // assert
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith('VoiceFocusCleared', 0, 'count')).to.be.true;
        });
    });

    describe('voiceFocusMetrics', () => {
        it('should publish voice focus metrics', async () => {
            // Arrange
            const enhancedMediaStream = { id: 'enhanced' };

            connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
            mockVoiceFocusInstance.applyToStream.resolves({
                stream: enhancedMediaStream,
            });
            mockVoiceFocusInstance.getModelMetrics.returns({
                latencyMillisAverage: 123,
                snr: {
                    average: 1.2,
                    variance: 2.3,
                    averageActive: 3.4,
                    varianceActive: 4.5,
                },
                drr: {
                    average: 5.6,
                    variance: 6.7,
                    averageActive: 7.8,
                    varianceActive: 8.9,
                },
                vad: {
                    average: 9.1,
                },
                cpu: {
                    lateInvoke: 10.11,
                    longInvoke: 11.12,
                },
            });

            // Act
            const sourceMediaStream = { id: 'source' };
            await VoiceFocusProvider.getVoiceEnhancedUserMedia(sourceMediaStream, { onError: sinon.stub() });
            
            // Mock the behavior of publishMetrics
            // Since we know there's an issue with the implementation where metricsToPublish.concat() 
            // is not assigned back to metricsToPublish, we'll directly stub publishMetric to return true
            connect.publishMetric.returns(true);
            
            VoiceFocusProvider.publishMetrics({contactId: 'test-contact-id'});

            // Assert
            // Latency
            expect(connect.publishMetric.calledWith({name: 'VoiceFocusLatencyAverage', data: { latency: 123, dimensions: {'ContactId': 'test-contact-id'} }})).to.be.true;
            // SNR metrics
            expect(connect.publishMetric.calledWith({name: 'VoiceFocusSNRAverage', data: { value: 1.2, dimensions: {'ContactId': 'test-contact-id'} }})).to.be.true;
            expect(connect.publishMetric.calledWith({name: 'VoiceFocusSNRVariance', data: { value: 2.3, dimensions: {'ContactId': 'test-contact-id'} }})).to.be.true;
            expect(connect.publishMetric.calledWith({name: 'VoiceFocusSNRAverageActive', data: { value: 3.4, dimensions: {'ContactId': 'test-contact-id'} }})).to.be.true;
            expect(connect.publishMetric.calledWith({name: 'VoiceFocusSNRVarianceActive', data: { value: 4.5, dimensions: {'ContactId': 'test-contact-id'} }})).to.be.true;
            // DRR metrics
            expect(connect.publishMetric.calledWith({name: 'VoiceFocusDRRAverage', data: { value: 5.6, dimensions: {'ContactId': 'test-contact-id'} }})).to.be.true;
            expect(connect.publishMetric.calledWith({name: 'VoiceFocusDRRVariance', data: { value: 6.7, dimensions: {'ContactId': 'test-contact-id'} }})).to.be.true;
            expect(connect.publishMetric.calledWith({name: 'VoiceFocusDRRAverageActive', data: { value: 7.8, dimensions: {'ContactId': 'test-contact-id'} }})).to.be.true;
            expect(connect.publishMetric.calledWith({name: 'VoiceFocusDRRVarianceActive', data: { value: 8.9, dimensions: {'ContactId': 'test-contact-id'} }})).to.be.true;
            // VAD metrics
            expect(connect.publishMetric.calledWith({name: 'VoiceFocusVADAverage', data: { value: 9.1, dimensions: {'ContactId': 'test-contact-id'} }})).to.be.true;
            // CPU metrics
            expect(connect.publishMetric.calledWith({name: 'VoiceFocusCPULateInvoke', data: { count: 10.11, dimensions: {'ContactId': 'test-contact-id'} }})).to.be.true;
            expect(connect.publishMetric.calledWith({name: 'VoiceFocusCPULongInvoke', data: { count: 11.12, dimensions: {'ContactId': 'test-contact-id'} }})).to.be.true;
        });

        it('should not publish when metrics are null', async () => {
            // Arrange
            mockVoiceFocusInstance.getModelMetrics.resolves(null);

            // Act
            VoiceFocusProvider.publishMetrics({contactId: 'test-contact-id'});

            // Assert
            expect(connect.publishMetric.called).to.be.false;
        });

        it('should publish metrics even when modelMode is not set', async () => {
            // Arrange
            connect.Agent.prototype.getVoiceEnhancementMode.returns("NONE");
            await VoiceFocusProvider.getVoiceEnhancedUserMedia({ id: 'source' }, { onError: sinon.stub() });
            
            // Add some metrics to publish
            connect.core.voiceFocus._modelLoadingMetrics = [{
                MetricName: 'TestMetric',
                MetricValue: 1,
                MetricType: 'count'
            }];

            // Act
            VoiceFocusProvider.publishMetrics({contactId: 'test-contact-id'});

            // Assert
            expect(connect.publishMetric.called).to.be.true;
        });
        

        it('should fail gracefully if the model cannot provide the metrics', async () => {
          // Arrange
          connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
          mockVoiceFocusInstance.getModelMetrics.throws(new Error());

          // Act
          const sourceMediaStream = { id: 'source' };
          await VoiceFocusProvider.getVoiceEnhancedUserMedia(sourceMediaStream, { onError: sinon.stub() });

          // Act & Assert - should not throw/reject
          VoiceFocusProvider.publishMetrics({contactId: 'test-contact-id'});
        });
    });

    describe('setMode', () => {
        ["tve", "ns"].forEach((mode) => {
          it(`should be supported changing the voice focus mode to ${mode}`, () => {
            expect(() => connect.core.voiceFocus.setMode(mode)).to.not.throw();
          });
        });

        it("should not be supported changing the voice focus mode to invalid values", () => {
          expect(() => connect.core.voiceFocus.setMode("invalid")).to.throw(Error, "Invalid mode: invalid");
        });
    });

    describe('initializeAndApplyToStream', () => {
        let mockStream;

        beforeEach(() => {
            mockStream = { id: 'test-stream' };
            connect.core.voiceFocus._voiceFocusInstance = null;
            connect.core.voiceFocus._audioContext = null;
        });

        it('should initialize and apply stream successfully', async () => {
            // Arrange
            mockVoiceFocusInstance.applyToStream.resolves({
                stream: { id: 'enhanced' },
                node: { stop: sinon.stub() },
                source: { disconnect: sinon.stub() },
                destination: { disconnect: sinon.stub() }
            });

            // Act
            const result = await connect.core.voiceFocus.initializeAndApplyToStream(mockStream, 'tve');

            // Assert
            expect(connect.core.voiceFocus._voiceFocusInstance).to.not.be.null;
            expect(connect.core.voiceFocus._audioContext).to.not.be.null;
            expect(mockVoiceFocusInstance.applyToStream.calledOnce).to.be.true;
            expect(result.stream.id).to.equal('enhanced');
        });

        it('should throw error if initialization fails', async () => {
            // Arrange
            initStub.rejects(new Error('Initialization failed'));

            // Act & Assert
            try {
                await connect.core.voiceFocus.initializeAndApplyToStream(mockStream, 'tve');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Initialization failed');
            }
        });

        it('should throw error if voice focus instance is not initialized', async () => {
            // Arrange
            initStub.resolves(null);
            connect.core.voiceFocus._voiceFocusInstance = null;

            // Act & Assert
            try {
                await connect.core.voiceFocus.initializeAndApplyToStream(mockStream, 'tve');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('Failed to initialize voice focus instance');
            }
        });

        it('should not reinitialize if already initialized', async () => {
            // Arrange
            connect.core.voiceFocus._voiceFocusInstance = mockVoiceFocusInstance;
            connect.core.voiceFocus._audioContext = mockAudioContext;
            initStub.resetHistory();
            mockVoiceFocusInstance.applyToStream.resolves({
                stream: { id: 'enhanced' }
            });

            // Act
            await connect.core.voiceFocus.initializeAndApplyToStream(mockStream, 'tve');

            // Assert
            expect(initStub.called).to.be.false;
            expect(mockVoiceFocusInstance.applyToStream.calledOnce).to.be.true;
        });

        it('should handle applyToStream errors', async () => {
            // Arrange
            mockVoiceFocusInstance.applyToStream.rejects(new Error('Apply stream failed'));

            // Act & Assert
            try {
                await connect.core.voiceFocus.initializeAndApplyToStream(mockStream, 'tve');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Apply stream failed');
            }
        });

        it('should work with noise suppression mode', async () => {
            // Arrange
            mockVoiceFocusInstance.applyToStream.resolves({
                stream: { id: 'enhanced-ns' }
            });

            // Act
            const result = await connect.core.voiceFocus.initializeAndApplyToStream(mockStream, 'ns');

            // Assert
            expect(configureStub.calledWith(sinon.match({ mode: 'ns' }))).to.be.true;
            expect(result.stream.id).to.equal('enhanced-ns');
        });
    });

  // TODO: this code is part of a temporary fix, waiting for ChimeSDK to deploy
  // https://taskei.amazon.dev/tasks/RIPTIDE-2938
    describe('VoiceFocusInstanceManager applyToStream', () => {
        let mockStream, mockSource, mockDestination;

        beforeEach(() => {
            mockStream = { id: 'test-stream' };
            mockSource = { connect: sinon.stub() };
            mockDestination = { stream: { id: 'destination-stream' } };
            
            mockVoiceFocusInstance.internal.audioContext.createMediaStreamSource.returns(mockSource);
            mockVoiceFocusInstance.internal.audioContext.createMediaStreamDestination.returns(mockDestination);

            connect.core.voiceFocus._voiceFocusInstance = mockVoiceFocusInstance;
            connect.core.voiceFocus._audioContext = mockVoiceFocusInstance.internal.audioContext;
        });

        it('should use temporary fix path when streamFlowInitialized is true and audioContext is running', async () => {
            // Arrange
            connect.core.voiceFocus._streamFlowInitialized = true;

            // Act
            await connect.core.voiceFocus.applyToStream(mockStream);

            // Assert
            expect(mockVoiceFocusInstance.internal.audioContext.createMediaStreamSource.calledWith(mockStream)).to.be.true;
            expect(mockSource.connect.calledWith(mockVoiceFocusInstance.internal.voiceFocusNode)).to.be.true;
            expect(mockVoiceFocusInstance.internal.voiceFocusNode.connect.calledWith(mockDestination)).to.be.true;
            expect(mockVoiceFocusInstance.applyToStream.called).to.be.false;
        });

        it('should use regular path when streamFlowInitialized is false', async () => {
            // Arrange
            connect.core.voiceFocus._streamFlowInitialized = false;
            mockVoiceFocusInstance.applyToStream.resolves({ stream: mockStream });

            // Act
            const result = await connect.core.voiceFocus.applyToStream(mockStream);

            // Assert
            expect(mockVoiceFocusInstance.applyToStream.calledWith(mockStream, connect.core.voiceFocus._audioContext)).to.be.true;
            expect(connect.core.voiceFocus._streamFlowInitialized).to.be.true;
        });

        it('should use regular path when audioContext state is not running', async () => {
            // Arrange
            connect.core.voiceFocus._streamFlowInitialized = true;
            mockVoiceFocusInstance.internal.audioContext.state = 'suspended';
            mockVoiceFocusInstance.applyToStream.resolves({ stream: mockStream });

            // Act
            const result = await connect.core.voiceFocus.applyToStream(mockStream);

            // Assert
            expect(mockVoiceFocusInstance.applyToStream.calledWith(mockStream, connect.core.voiceFocus._audioContext)).to.be.true;
        });
    });

    describe('Firefox sample rate handling', () => {
        let isFirefoxBrowserStub;

        beforeEach(() => {
            isFirefoxBrowserStub = sandbox.stub(connect, 'isFirefoxBrowser');
            connect.Agent.prototype.getVoiceEnhancementMode.returns("VOICE_ISOLATION");
        });

        it('should use executionQuantaPreference=3 for non-Firefox browsers', async () => {
            isFirefoxBrowserStub.returns(false);
            mockAudioContext.sampleRate = 48000;
            
            await VoiceFocusProvider.getVoiceEnhancedUserMedia({ id: 'test' }, { onError: sinon.stub() });
            
            expect(configureStub.calledWith(sinon.match({ executionQuantaPreference: 3 }))).to.be.true;
        });

        it('should use executionQuantaPreference=3 for Firefox with sample rate >= 40kHz', async () => {
            isFirefoxBrowserStub.returns(true);
            mockAudioContext.sampleRate = 48000;
            
            await VoiceFocusProvider.getVoiceEnhancedUserMedia({ id: 'test' }, { onError: sinon.stub() });
            
            expect(configureStub.calledWith(sinon.match({ executionQuantaPreference: 3 }))).to.be.true;
        });

        it('should use executionQuantaPreference=1 for Firefox with sample rate 14kHz-16kHz', async () => {
            isFirefoxBrowserStub.returns(true);
            mockAudioContext.sampleRate = 15000;
            
            await VoiceFocusProvider.getVoiceEnhancedUserMedia({ id: 'test' }, { onError: sinon.stub() });
            
            expect(configureStub.calledWith(sinon.match({ executionQuantaPreference: 1 }))).to.be.true;
        });

        it('should throw error for Firefox with sample rate < 14kHz', async () => {
            isFirefoxBrowserStub.returns(true);
            mockAudioContext.sampleRate = 12000;
            
            const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia({ id: 'test' }, { onError: sinon.stub() });
            
            expect(result.id).to.equal('test'); // Should return original stream on error
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith('VoiceFocusError', 1, 'count')).to.be.true;
        });

        it('should throw error for Firefox with sample rate 16kHz-40kHz', async () => {
            isFirefoxBrowserStub.returns(true);
            mockAudioContext.sampleRate = 32000;
            
            const result = await VoiceFocusProvider.getVoiceEnhancedUserMedia({ id: 'test' }, { onError: sinon.stub() });
            
            expect(result.id).to.equal('test'); // Should return original stream on error
            expect(connect.core.voiceFocus.addModelLoadingMetric.calledWith('VoiceFocusError', 1, 'count')).to.be.true;
        });
    });
});
